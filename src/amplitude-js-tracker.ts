import amplitude from "amplitude-js";
import {
  Options,
  EventProperties,
  DefaultEventProperties,
  AmplitudeEvent,
  PerformanceMetrics,
  DEFAULT_OPTIONS,
  DEFAULT_EXCLUDE_DATASET_KEY,
  DatasetObject,
  DatasetEntry,
  ParsedDatasetEntry,
  TrackableEvent,
  AmplitudeJsTrackerEvent
} from "./@types/amplitude-js-tracker";

import { scrollViewPercentual, isElementInView } from "./amplitude-js-utils";
import AmplitudeJsPerformanceMetrics from "./amplitude-js-performance-metrics";

class AmplitudeJsTracker {
  _apiKey?: string;
  _instanceInitialized: boolean;
  _eventsQueue: AmplitudeEvent[];
  _maxScreenViewedPercentual: number;
  _trackedScreenElements: Node[];
  _currentScrollTimeout?: number;

  options: Options;
  instance: amplitude.AmplitudeClient;

  constructor(apiKey?: string, options: Options = DEFAULT_OPTIONS()) {
    // constructor-bound functions
    this._bindFunctions();

    const { instanceName } = options;

    this._eventsQueue = [];
    this._instanceInitialized = false;
    this._maxScreenViewedPercentual = 0;
    this._trackedScreenElements = [];

    this.options = options;
    debugger;
    this.instance = amplitude.getInstance(instanceName);

    if (apiKey) this.setApiKey(apiKey);
  }

  _bindFunctions(): void {
    this._afterInitialize = this._afterInitialize.bind(this);
    this._scrollEventHandler = this._scrollEventHandler.bind(this);
    this._logPerformanceMetrics = this._logPerformanceMetrics.bind(this);
    this._logScreenViews = this._logScreenViews.bind(this);
    this._logScrollMap = this._logScrollMap.bind(this);
    this._logViewedElementEvent = this._logViewedElementEvent.bind(this);

    this.track = this.track.bind(this);
    this.logEvent = this.logEvent.bind(this);
    this.logPageView = this.logPageView.bind(this);
    this.trackClickOnElement = this.trackClickOnElement.bind(this);
    this.logClickedElementEvent = this.logClickedElementEvent.bind(this);
    this.trackHoverOnElement = this.trackHoverOnElement.bind(this);
    this.logHoveredElementEvent = this.logHoveredElementEvent.bind(this);
    this.trackScreenViews = this.trackScreenViews.bind(this);
    this.trackScrollMap = this.trackScrollMap.bind(this);
    this.trackScreenElementView = this.trackScreenElementView.bind(this);
    this.trackPerformanceMetrics = this.trackPerformanceMetrics.bind(this);
  }

  setApiKey(apiKey: string): void {
    const { userId } = this.options;

    this._apiKey = apiKey;
    this.instance.init(apiKey, userId, this.options, this._afterInitialize);
  }

  track(): void {
    this.trackClickOnElement();
    this.trackHoverOnElement();
    this.trackScreenViews();
  }

  _queueEvent(name: string, properties: EventProperties = {}): void {
    const queuedEvent: AmplitudeEvent = {
      name,
      properties
    };

    // TODO: Improve to use localstorage for eventsQueue so we don't
    // lose some events if page is refreshed before processQueue
    this._eventsQueue.push(queuedEvent);
  }

  processQueue(): void {
    this._eventsQueue.forEach((event: AmplitudeEvent): void => {
      this.logEvent(event.name, event.properties);
    });

    this._eventsQueue = [];
  }

  logEvent(name: string, properties?: EventProperties): void {
    const { eventPrefix, fixedEventProperties } = this.options;
    const detaultEventProperties: DefaultEventProperties = this._defaultEventProperties();

    const eventName: string = eventPrefix ? `${eventPrefix} ${name}` : name;
    const eventProperties: EventProperties = {
      ...properties,
      ...fixedEventProperties,
      ...detaultEventProperties
    };

    this._logOrQueueEvent(eventName, eventProperties);
  }

  _logOrQueueEvent(name: string, properties?: EventProperties): void {
    if (this._instanceInitialized) {
      this.instance.logEvent(name, properties);
    } else {
      this._queueEvent(name, properties);
    }
  }

  logPageView(pageName: string, properties?: EventProperties): void {
    const eventName: string = AmplitudeJsTrackerEvent.PAGE_VIEW.replace(
      "${pageName}",
      pageName.toLocaleLowerCase()
    );

    this.logEvent(eventName, properties);
  }

  _trackEventOnElement(
    eventName: string,
    elementSelector: string,
    eventHandler: EventListener
  ): Node[] {
    const targetElements: Node[] = [];

    if (!elementSelector) return targetElements;

    const targetNodeList: NodeList = document.querySelectorAll(elementSelector);

    targetNodeList.forEach((element: Node) => {
      element.addEventListener(eventName, eventHandler);
      targetElements.push(element);
    });

    return targetElements;
  }

  trackClickOnElement(elementSelector?: string): Node[] {
    const { onClickSelector } = this.options;
    const targetClass: string = elementSelector || (onClickSelector as string);

    const targetElements: Node[] = this._trackEventOnElement(
      TrackableEvent.CLICK,
      targetClass,
      this.logClickedElementEvent
    );

    return targetElements;
  }

  logClickedElementEvent(event: Event): boolean {
    if (!event || !event.currentTarget) return false;

    const target: HTMLElement = event.currentTarget as HTMLElement;
    const properties: EventProperties | undefined = this._propertiesFromTarget(
      target
    );

    this.logEvent(AmplitudeJsTrackerEvent.ELEMENT_CLICK, { ...properties });

    return true;
  }

  trackHoverOnElement(elementSelector?: string): Node[] {
    const { onHoverSelector } = this.options;
    const targetClass: string = elementSelector || (onHoverSelector as string);

    const targetElements: Node[] = this._trackEventOnElement(
      TrackableEvent.MOUSE_ENTER,
      targetClass,
      this.logHoveredElementEvent
    );

    return targetElements;
  }

  logHoveredElementEvent(event: Event): boolean {
    if (!event || !event.currentTarget) return false;

    const target: HTMLElement = event.currentTarget as HTMLElement;
    const properties: EventProperties | undefined = this._propertiesFromTarget(
      target
    );

    this.logEvent(AmplitudeJsTrackerEvent.ELEMENT_HOVER, { ...properties });

    return true;
  }

  trackScreenViews(): void {
    this.trackScrollMap();
    this.trackScreenElementView();
  }

  _logScreenViews(): void {
    this._logScrollMap();
    this._logViewedElementEvent();
  }

  trackScrollMap(): void {
    this._maxScreenViewedPercentual = 0;
    this._addScrollEventListener();
  }

  _logScrollMap(): void {
    const descendingScrollSteps: number[] = this._descendingScrollSteps();
    const currentsSrollViewPercentual: number = scrollViewPercentual();

    if (currentsSrollViewPercentual <= this._maxScreenViewedPercentual) return;

    const scrollStep: number | undefined = descendingScrollSteps.find(
      (value: number) =>
        value > this._maxScreenViewedPercentual &&
        value <= currentsSrollViewPercentual
    );

    if (!scrollStep) return;

    this._maxScreenViewedPercentual = scrollStep;
    this.logEvent(AmplitudeJsTrackerEvent.PAGE_SCROLL, {
      value: this._maxScreenViewedPercentual
    });
  }

  trackScreenElementView(elementSelector?: string): Node[] {
    const { onViewedSelector } = this.options;
    const targetClass: string = elementSelector || (onViewedSelector as string);

    const targetNodeList: NodeList = document.querySelectorAll(targetClass);
    const targetElements: Node[] = Array.from(targetNodeList);

    this._trackedScreenElements = [
      ...this._trackedScreenElements,
      ...targetElements
    ];

    this._addScrollEventListener();

    return targetElements;
  }

  trackPerformanceMetrics(): void {
    if (!window.PerformanceObserver || !window.performance) return;

    const amplitudeJsPerformanceMetrics: AmplitudeJsPerformanceMetrics = new AmplitudeJsPerformanceMetrics();
    amplitudeJsPerformanceMetrics
      .collectPerformanceMetrics()
      .then(this._logPerformanceMetrics);
  }

  _logPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.logEvent(AmplitudeJsTrackerEvent.PERFORMANCE_METRICS, metrics);
  }

  _logViewedElementEvent(): boolean {
    if (!this._trackedScreenElements.length) return false;

    const viewedElements: Node[] = this._trackedScreenElements.filter(
      (element: Node) => isElementInView(element as HTMLElement)
    );

    if (!viewedElements.length) return false;

    viewedElements.forEach((element: Node) => {
      const properties:
        | EventProperties
        | undefined = this._propertiesFromTarget(element as HTMLElement);

      this.logEvent(AmplitudeJsTrackerEvent.ELEMENT_VIEW, { ...properties });
    });

    this._trackedScreenElements = this._trackedScreenElements.filter(
      (element: Node) => !viewedElements.includes(element)
    );

    return true;
  }

  _propertiesFromTarget(element: HTMLElement): EventProperties | undefined {
    if (!element.dataset) return;

    const excludedElementKeys: string[] = this._excludedDataProperties(element);

    const allowedDatasetEntries: DatasetEntry[] = Object.entries(
      element.dataset
    ).filter(([key]) => !excludedElementKeys.includes(key));

    const parsedDatasetEntries: ParsedDatasetEntry[] = this._parseDatasetEntries(
      allowedDatasetEntries
    );

    const properties: EventProperties = Object.fromEntries(
      parsedDatasetEntries
    );

    return properties;
  }

  _excludedDataProperties(element: HTMLElement): string[] {
    const { excludedProperties } = this.options;
    const { amplitudeExclude, ...dataProperties } = element.dataset;

    let excludedKeys: string[] = [];

    if (amplitudeExclude) {
      excludedKeys = excludedKeys.concat(
        this._excludedElementDataProperties(amplitudeExclude)
      );
    }

    if (excludedProperties) {
      excludedKeys = excludedKeys.concat(
        this._excludedGlobalDataProperties(dataProperties)
      );
    }

    return excludedKeys;
  }

  _excludedElementDataProperties(amplitudeExclude?: string): string[] {
    let excludedKeys: string[] = [];

    if (!amplitudeExclude) return excludedKeys;

    const amplitudeExcludeKeys: string[] = amplitudeExclude
      .replace(/[[\]"'\s]/g, "")
      .split(",");

    excludedKeys = excludedKeys.concat(amplitudeExcludeKeys);

    return excludedKeys;
  }

  _excludedGlobalDataProperties(dataProperties: DatasetObject): string[] {
    const { excludedProperties } = this.options;
    let excludedKeys: string[] = [DEFAULT_EXCLUDE_DATASET_KEY];

    if (!excludedProperties) return excludedKeys;

    Object.keys(dataProperties).forEach((key: string) => {
      excludedProperties.forEach((excludedProperty: RegExp) => {
        if (excludedProperty.test(key)) {
          excludedKeys.push(key);
        }
      });
    });

    return excludedKeys;
  }

  _parseDatasetEntries(
    unparsedDatasetEntries: DatasetEntry[]
  ): ParsedDatasetEntry[] {
    const parsedEntries: ParsedDatasetEntry[] = unparsedDatasetEntries.map(
      ([key, value]): ParsedDatasetEntry => {
        const booleanValue: RegExp = /^boolean/;
        const numericValue: RegExp = /^numeric/;

        let parsedKey: string = key;
        let parsedValue: string | number | boolean | undefined = value;
        let parsedEntry: ParsedDatasetEntry;

        if (booleanValue.test(key)) {
          parsedKey = this._parseDatasetKey(key, booleanValue);

          if (value !== undefined) parsedValue = value === "true";
        } else if (numericValue.test(key)) {
          parsedKey = this._parseDatasetKey(key, numericValue);

          if (value !== undefined) parsedValue = parseFloat(value);
        }

        parsedEntry = [parsedKey, parsedValue];

        return parsedEntry;
      }
    );

    return parsedEntries;
  }

  _parseDatasetKey(key: string, term: RegExp): string {
    return key.replace(term, "").replace(/^\w/, c => c.toLowerCase());
  }

  _defaultEventProperties(): DefaultEventProperties {
    const useDefaultEventProperties =
      this.options.useDefaultEventProperties ||
      DEFAULT_OPTIONS().useDefaultEventProperties;

    if (!useDefaultEventProperties) return {};

    const defaultEventProperties: DefaultEventProperties = {
      ...(useDefaultEventProperties.origin && {
        origin: window.location.origin
      }),
      ...(useDefaultEventProperties.pagePath && {
        pagePath: window.location.pathname
      })
    };

    return defaultEventProperties;
  }

  _addScrollEventListener(): void {
    this._scrollEventHandler();

    window.addEventListener(TrackableEvent.SCROLL, this._scrollEventHandler, {
      capture: true,
      passive: true
    });
  }

  _scrollEventHandler(): void {
    if (this._currentScrollTimeout) {
      window.clearTimeout(this._currentScrollTimeout);
    }

    this._currentScrollTimeout = window.setTimeout(
      this._logScreenViews,
      this.options.scrollTimeout
    );
  }

  _descendingScrollSteps(): number[] {
    const scrollSteps: number[] =
      this.options.scrollSteps || DEFAULT_OPTIONS().scrollSteps || [];

    return scrollSteps.sort((a: number, b: number) => b - a);
  }

  _afterInitialize(): void {
    this._instanceInitialized = true;
    this.processQueue();
  }
}

export default AmplitudeJsTracker;
