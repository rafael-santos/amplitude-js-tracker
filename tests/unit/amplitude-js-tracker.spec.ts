import amplitude from "amplitude-js";
import {
  Options,
  EventProperties,
  AmplitudeEvent,
  FixedEventProperties,
  DefaultEventProperties,
  UseDefaultEventProperties,
  PerformanceMetrics,
  DEFAULT_OPTIONS,
  DEFAULT_ON_CLICK_CLASS,
  DEFAULT_ON_CLICK_SELECTOR,
  DEFAULT_ON_HOVER_SELECTOR,
  DEFAULT_ON_VIEWED_CLASS,
  DEFAULT_ON_VIEWED_SELECTOR,
  DEFAULT_SCROLL_STEPS,
  DEFAULT_SCROLL_TIMEOUT,
  NUMERIC_EVENT_PROPERTIES,
  DEFAULT_EXCLUDE_DATASET_KEY,
  DEFAULT_EXCLUDE_PROPERTIES,
  DEFAULT_USE_DEFAULT_EVENT_PROPERTIES,
  DatasetObject,
  DatasetEntry,
  ParsedDatasetEntry
} from "@/@types/amplitude-js-tracker";
import AmplitudeJsTracker from "@/amplitude-js-tracker";

import * as AmplitudeJsUtils from "@/amplitude-js-utils";
import * as AmplitudeTypes from "@/@types/amplitude-js-tracker";

const mockCollectPerformanceMetrics = jest.fn().mockResolvedValue({});
jest.mock("@/amplitude-js-performance-metrics", () => {
  return jest.fn().mockImplementation(() => {
    return { collectPerformanceMetrics: mockCollectPerformanceMetrics };
  });
});

const { origin, pathname } = window.location;

const apiKey: string = "fake-api-key";
const name: string = "Event name";
const properties: EventProperties = {
  description: "Event description property"
};

const elementId: string = "tested-element";
const dataDescription: string = "Element description";
const dataHref: string = "/home";

const customClickClass: string = "jest-spec-click";
const customClickSelector: string = `.${customClickClass}`;
const customHoverClass: string = "jest-spec-hover";
const customHoverSelector: string = `.${customHoverClass}`;
const customViewedClass: string = "jest-spec-viewed";
const customViewedSelector: string = `.${customViewedClass}`;

describe("#DEFAULT_OPTIONS", () => {
  it("returns expected defaultOptions value", () => {
    const expected = {
      useDefaultEventProperties: DEFAULT_USE_DEFAULT_EVENT_PROPERTIES(),
      onClickSelector: DEFAULT_ON_CLICK_SELECTOR,
      onHoverSelector: DEFAULT_ON_HOVER_SELECTOR,
      onViewedSelector: DEFAULT_ON_VIEWED_SELECTOR,
      numericDatasetProperties: NUMERIC_EVENT_PROPERTIES(),
      scrollSteps: DEFAULT_SCROLL_STEPS(),
      scrollTimeout: DEFAULT_SCROLL_TIMEOUT,
      includeReferrer: true,
      includeUtm: true,
      excludedProperties: DEFAULT_EXCLUDE_PROPERTIES
    };

    const result: Options = DEFAULT_OPTIONS();

    expect(result).toEqual(expected);
  });
});

describe("AmplitudeJsTracker", () => {
  describe("#constructor", () => {
    it("calls _bindFunctions() to bound necessary function's scope ", () => {
      const expected: string = "bound ";
      const result: AmplitudeJsTracker = new AmplitudeJsTracker();

      expect(result._afterInitialize.name).toEqual(expected);
      expect(result._scrollEventHandler.name).toEqual(expected);
      expect(result._logPerformanceMetrics.name).toEqual(expected);
      expect(result._logScreenViews.name).toEqual(expected);
      expect(result._logScrollMap.name).toEqual(expected);
      expect(result._logViewedElementEvent.name).toEqual(expected);

      expect(result.track.name).toEqual(expected);
      expect(result.logEvent.name).toEqual(expected);
      expect(result.logPageView.name).toEqual(expected);
      expect(result.trackClickOnElement.name).toEqual(expected);
      expect(result.logClickedElementEvent.name).toEqual(expected);
      expect(result.trackHoverOnElement.name).toEqual(expected);
      expect(result.logHoveredElementEvent.name).toEqual(expected);
      expect(result.trackScreenViews.name).toEqual(expected);
      expect(result.trackScrollMap.name).toEqual(expected);
      expect(result.trackScreenElementView.name).toEqual(expected);
      expect(result.trackPerformanceMetrics.name).toEqual(expected);
    });

    it("works when called without any optional param", () => {
      const result: AmplitudeJsTracker = new AmplitudeJsTracker();

      expect(result).toBeDefined();
      expect(result._eventsQueue).toEqual([]);
      expect(result.options).toEqual(DEFAULT_OPTIONS());
      expect(result._apiKey).not.toBeDefined();
      expect(result._instanceInitialized).toEqual(false);
      expect(result.instance).toBeDefined();
    });

    it("sets options attribute when options param is received", () => {
      const options: Options = {
        eventPrefix: "[FBO]"
      };

      const result: AmplitudeJsTracker = new AmplitudeJsTracker(undefined, options);

      expect(result.options).toEqual(options);
    });

    it("creates a named instance if instanceName option is passed", () => {
      const instanceName: string = "named-instance-test";
      const namedOption: Options = { instanceName };

      const result: AmplitudeJsTracker = new AmplitudeJsTracker(undefined, namedOption);

      const expected: amplitude.AmplitudeClient = amplitude.getInstance(instanceName);

      expect(result.instance).toEqual(expected);
    });

    it("initialize amplitude instance if apiKey is passed", () => {
      const result: AmplitudeJsTracker = new AmplitudeJsTracker(apiKey);

      expect(result._apiKey).toEqual(apiKey);
      expect(result._instanceInitialized).toBe(true);
    });

    it("initialize amplitude instance with options if apiKey and options are passed", () => {
      const options: Options = {
        includeReferrer: true,
        includeUtm: true
      };

      const result: AmplitudeJsTracker = new AmplitudeJsTracker(apiKey, options);

      expect(result.instance.options).toEqual(expect.objectContaining(options));
    });
  });

  describe("#setApiKey", () => {
    it("sets apiKey property", () => {
      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
      expect(amplitudeJsTracker._apiKey).not.toBeDefined();

      amplitudeJsTracker.setApiKey(apiKey);

      expect(amplitudeJsTracker._apiKey).toEqual(apiKey);
    });

    it("initiate amplitude instance with apiKey, userId and options", () => {
      const userId: string = "fake-user-id";
      const options: Options = {
        userId,
        domain: "fake-domain"
      };

      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker(
        undefined,
        options
      );
      amplitudeJsTracker.instance.init = jest.fn();

      amplitudeJsTracker.setApiKey(apiKey);

      expect(amplitudeJsTracker.instance.init).toHaveBeenCalledWith(
        apiKey,
        userId,
        options,
        amplitudeJsTracker._afterInitialize
      );
    });
  });

  describe("#track", () => {
    it("calls every track method", () => {
      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.trackClickOnElement = jest.fn();
      amplitudeJsTracker.trackHoverOnElement = jest.fn();
      amplitudeJsTracker.trackScreenViews = jest.fn();

      amplitudeJsTracker.track();

      expect(amplitudeJsTracker.trackClickOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.trackHoverOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.trackScreenViews).toHaveBeenCalledTimes(1);
    });
  });

  describe("#_queueEvent", () => {
    it("pushes an event to eventQueue without params", () => {
      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
      const expected: AmplitudeEvent = { name, properties: {} };

      amplitudeJsTracker._queueEvent(name);

      expect(amplitudeJsTracker._eventsQueue.length).toBe(1);
      expect(amplitudeJsTracker._eventsQueue[0]).toEqual(expected);
    });

    it("pushes an event to eventQueue with params", () => {
      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
      const expected: AmplitudeEvent = { name, properties };

      amplitudeJsTracker._queueEvent(name, properties);

      expect(amplitudeJsTracker._eventsQueue.length).toBe(1);
      expect(amplitudeJsTracker._eventsQueue[0]).toEqual(expected);
    });
  });

  describe("#processQueue", () => {
    it("calls logEvent() for every event in queueEvent and clears queue", () => {
      const event: AmplitudeEvent = { name, properties };
      const eventQueue: AmplitudeEvent[] = [event, event, event];

      const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._eventsQueue = eventQueue;
      amplitudeJsTracker.logEvent = jest.fn();

      amplitudeJsTracker.processQueue();

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(3);
      expect(amplitudeJsTracker._eventsQueue.length).toBe(0);
    });
  });

  describe("#logEvent", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._logOrQueueEvent = jest.fn();
      amplitudeJsTracker._defaultEventProperties = jest.fn().mockReturnValue({});
    });

    it("concats event name with options.eventPrefix when specified", () => {
      const eventPrefix: string = "[SPEC]";
      const options: Options = { eventPrefix };

      const expected = `${eventPrefix} ${name}`;

      amplitudeJsTracker.options = options;
      amplitudeJsTracker.logEvent(name);

      expect(amplitudeJsTracker._logOrQueueEvent).toHaveBeenCalledWith(expected, {});
    });

    it("merges event properties with options.fixedEventProperties and defaultEventProperties when specified", () => {
      const defaultEventProperties: DefaultEventProperties = {
        origin,
        pagePath: pathname
      };

      amplitudeJsTracker._defaultEventProperties = jest.fn(
        () => defaultEventProperties
      );

      const fixedEventProperties: FixedEventProperties = {
        mobile: true,
        system: "Linux"
      };

      const useDefaultEventProperties: UseDefaultEventProperties = {
        origin: true,
        pagePath: true
      };

      const options: Options = {
        fixedEventProperties,
        useDefaultEventProperties
      };

      const expected = {
        ...properties,
        ...fixedEventProperties,
        ...defaultEventProperties
      };

      amplitudeJsTracker.options = options;
      amplitudeJsTracker.logEvent(name, properties);

      expect(amplitudeJsTracker._logOrQueueEvent).toHaveBeenCalledWith(name, expected);
    });
  });

  describe("#_logOrQueueEvent", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.instance.logEvent = jest.fn();
      amplitudeJsTracker._queueEvent = jest.fn();
    });

    it("calls amplitude instance logEvent if instance is initialized", () => {
      amplitudeJsTracker._instanceInitialized = true;

      amplitudeJsTracker._logOrQueueEvent(name, properties);

      expect(amplitudeJsTracker.instance.logEvent).toHaveBeenCalledWith(
        name,
        properties
      );
      expect(amplitudeJsTracker._queueEvent).not.toHaveBeenCalled();
    });

    it("queue event if instance is not initialized", () => {
      amplitudeJsTracker._instanceInitialized = false;

      amplitudeJsTracker._logOrQueueEvent(name, properties);

      expect(amplitudeJsTracker.instance.logEvent).not.toHaveBeenCalled();
      expect(amplitudeJsTracker._queueEvent).toHaveBeenCalledWith(name, properties);
    });
  });

  describe("#logPageView", () => {
    it("calls logEvent() with correct page view event name and properties", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.logEvent = jest.fn();

      const pageName = "Home";
      const expectedName = `Viewed ${pageName.toLocaleLowerCase()} page`;

      amplitudeJsTracker.logPageView(pageName, properties);

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledWith(
        expectedName,
        properties
      );
    });
  });

  describe("#_trackEventOnElement", () => {
    const eventName: string = "customevent";

    let addEventListenerMock: jest.Mock;
    let eventHandlerMock: jest.Mock;
    let amplitudeJsTracker: AmplitudeJsTracker;
    let customClickClassElements: NodeList;

    const htmlElements: string = `
      <button class="${DEFAULT_ON_CLICK_CLASS}"></button>
      <button class="${DEFAULT_ON_CLICK_CLASS}"></button>
      <div class="${customClickClass}"></div>
    `;

    beforeEach(() => {
      addEventListenerMock = jest.fn();
      eventHandlerMock = jest.fn();
      amplitudeJsTracker = new AmplitudeJsTracker();

      document.body.innerHTML = htmlElements;
      customClickClassElements = document.querySelectorAll(customClickSelector);

      const elements: NodeList = document.querySelectorAll("*");
      elements.forEach((element: Node) => {
        element.addEventListener = addEventListenerMock;
      });
    });

    it("returns an empty Array if no elementSelector is not defined", () => {
      const expected: Node[] = [];

      const elementSelector: unknown = undefined;
      const result: Node[] = amplitudeJsTracker._trackEventOnElement(
        eventName,
        elementSelector as string,
        eventHandlerMock
      );

      expect(result).toEqual(expected);
    });

    it("returns an Array with correct targeted elements if elementSelector is defined", () => {
      const result: Node[] = amplitudeJsTracker._trackEventOnElement(
        eventName,
        customClickSelector,
        eventHandlerMock
      );

      expect(result.length).toBe(1);
      expect(result[0]).toEqual(customClickClassElements.item(0));
    });

    it("adds event listener to targeted elements", () => {
      amplitudeJsTracker._trackEventOnElement(
        eventName,
        DEFAULT_ON_CLICK_SELECTOR,
        eventHandlerMock
      );

      expect(addEventListenerMock).toHaveBeenCalledTimes(2);
      expect(addEventListenerMock).toHaveBeenCalledWith(eventName, eventHandlerMock);
    });
  });

  describe("#trackClickOnElement", () => {
    const clickEvent: string = "click";
    const fakeTargetElements: string[] = ["fake", "target", "elements"];
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._trackEventOnElement = jest
        .fn()
        .mockReturnValue(fakeTargetElements);
    });

    it("calls AmplitudeJsTracker.trackEventOnElement() with correct params", () => {
      amplitudeJsTracker.trackClickOnElement(customClickSelector);

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        clickEvent,
        customClickSelector,
        amplitudeJsTracker.logClickedElementEvent
      );
    });

    it("returns targeted elements in Array", () => {
      const result: Node[] = amplitudeJsTracker.trackClickOnElement(
        customClickSelector
      );

      expect(result).toEqual(fakeTargetElements);
    });

    it("uses options.onClickSelector if no elementSelector is passed", () => {
      amplitudeJsTracker.options = {
        onClickSelector: DEFAULT_ON_CLICK_SELECTOR
      };

      amplitudeJsTracker.trackClickOnElement();

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        clickEvent,
        DEFAULT_ON_CLICK_SELECTOR,
        amplitudeJsTracker.logClickedElementEvent
      );
    });

    it("uses elementSelector with precedence over options.onClickSelector", () => {
      amplitudeJsTracker.options = {
        onClickSelector: DEFAULT_ON_CLICK_SELECTOR
      };

      amplitudeJsTracker.trackClickOnElement(customClickSelector);

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        clickEvent,
        customClickSelector,
        amplitudeJsTracker.logClickedElementEvent
      );
    });
  });

  describe("#logClickedElementEvent", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.logEvent = jest.fn();
      amplitudeJsTracker._propertiesFromTarget = jest.fn();
    });

    it("returns false if event is not defined", () => {
      const event: unknown = undefined;
      const result = amplitudeJsTracker.logClickedElementEvent(event as Event);

      expect(result).toEqual(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("returns false if event.currentTarget param is not defined", () => {
      const event: Event = new Event("");
      const result = amplitudeJsTracker.logClickedElementEvent(event);

      expect(result).toEqual(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("calls AmplitudeJsTracker.logEvent() with correct params", () => {
      const htmlElement: string = `<div id="${elementId}"></div>`;
      document.body.innerHTML = htmlElement;

      const target: HTMLElement = document.getElementById(elementId) as HTMLElement;

      const event: Event = ({
        currentTarget: target
      } as unknown) as Event;

      const expectedName: string = "Click on element";
      const expectedProperties: EventProperties = {
        description: dataDescription
      };

      (amplitudeJsTracker._propertiesFromTarget as jest.Mock).mockReturnValue({
        description: dataDescription
      });

      amplitudeJsTracker.logClickedElementEvent(event);

      expect(amplitudeJsTracker._propertiesFromTarget).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._propertiesFromTarget).toHaveBeenCalledWith(target);
      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledWith(
        expectedName,
        expectedProperties
      );
    });
  });

  describe("#trackHoverOnElement", () => {
    const hoverEvent: string = "mouseenter";
    const fakeTargetElements: string[] = ["fake", "target", "elements"];
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._trackEventOnElement = jest
        .fn()
        .mockReturnValue(fakeTargetElements);
    });

    it("calls AmplitudeJsTracker.trackEventOnElement() with correct params", () => {
      amplitudeJsTracker.trackHoverOnElement(customHoverSelector);

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        hoverEvent,
        customHoverSelector,
        amplitudeJsTracker.logHoveredElementEvent
      );
    });

    it("returns targeted elements in Array", () => {
      const result: Node[] = amplitudeJsTracker.trackHoverOnElement(
        customHoverSelector
      );

      expect(result).toEqual(fakeTargetElements);
    });

    it("uses options.onHoverSelector if no elementSelector is passed", () => {
      amplitudeJsTracker.options = {
        onHoverSelector: DEFAULT_ON_HOVER_SELECTOR
      };

      amplitudeJsTracker.trackHoverOnElement();

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        hoverEvent,
        DEFAULT_ON_HOVER_SELECTOR,
        amplitudeJsTracker.logHoveredElementEvent
      );
    });

    it("uses elementSelector with precedence over options.onHoverSelector", () => {
      amplitudeJsTracker.options = {
        onHoverSelector: DEFAULT_ON_HOVER_SELECTOR
      };

      amplitudeJsTracker.trackHoverOnElement(customHoverSelector);

      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._trackEventOnElement).toHaveBeenCalledWith(
        hoverEvent,
        customHoverSelector,
        amplitudeJsTracker.logHoveredElementEvent
      );
    });
  });

  describe("#logHoveredElementEvent", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.logEvent = jest.fn();
      amplitudeJsTracker._propertiesFromTarget = jest.fn();
    });

    it("returns false if event is not defined", () => {
      const event: unknown = undefined;
      const result = amplitudeJsTracker.logHoveredElementEvent(event as Event);

      expect(result).toEqual(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("returns false if event.currentTarget param is not defined", () => {
      const event: Event = new Event("");
      const result = amplitudeJsTracker.logHoveredElementEvent(event);

      expect(result).toEqual(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("calls AmplitudeJsTracker.logEvent() with correct params", () => {
      const htmlElement: string = `<div id="${elementId}"></div>`;
      document.body.innerHTML = htmlElement;

      const target: HTMLElement = document.getElementById(elementId) as HTMLElement;

      const event: Event = ({
        currentTarget: target
      } as unknown) as Event;

      const expectedName: string = "Hover on element";
      const expectedProperties: EventProperties = {
        description: dataDescription
      };

      (amplitudeJsTracker._propertiesFromTarget as jest.Mock).mockReturnValue({
        description: dataDescription
      });

      amplitudeJsTracker.logHoveredElementEvent(event);

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledWith(
        expectedName,
        expectedProperties
      );
    });
  });

  describe("#trackScreenViews", () => {
    it("calls trackScrollMap() and trackScreenElementView()", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();

      amplitudeJsTracker.trackScrollMap = jest.fn();
      amplitudeJsTracker.trackScreenElementView = jest.fn();

      amplitudeJsTracker.trackScreenViews();

      expect(amplitudeJsTracker.trackScrollMap).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.trackScreenElementView).toHaveBeenCalledTimes(1);
    });
  });

  describe("#_logScreenViews", () => {
    it("calls logScrollMap() and logViewedElementEvent()", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();

      amplitudeJsTracker._logScrollMap = jest.fn();
      amplitudeJsTracker._logViewedElementEvent = jest.fn();

      amplitudeJsTracker._logScreenViews();

      expect(amplitudeJsTracker._logScrollMap).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker._logViewedElementEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("#trackScrollMap", () => {
    it("resets amplitudeJsTracker._maxScreenViewedPercentual and calls _addScrollEventListener()", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();

      amplitudeJsTracker._addScrollEventListener = jest.fn();
      amplitudeJsTracker._maxScreenViewedPercentual = 100;

      amplitudeJsTracker.trackScrollMap();

      expect(amplitudeJsTracker._maxScreenViewedPercentual).toEqual(0);
      expect(amplitudeJsTracker._addScrollEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("#_logScrollMap", () => {
    const scrollViewPercentual = jest.spyOn(AmplitudeJsUtils, "scrollViewPercentual");

    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.options.scrollSteps = [20, 40, 80];
      amplitudeJsTracker._maxScreenViewedPercentual = 100;

      amplitudeJsTracker._descendingScrollSteps = jest.fn(() => [80, 40, 20]);
      amplitudeJsTracker.logEvent = jest.fn();

      scrollViewPercentual.mockReturnValue(0);
    });

    afterEach(() => {
      scrollViewPercentual.mockClear();
    });

    afterAll(() => {
      scrollViewPercentual.mockRestore();
    });

    it("calls _descendingScrollSteps() to get sorted options.scrollSteps", () => {
      amplitudeJsTracker._logScrollMap();

      expect(amplitudeJsTracker._descendingScrollSteps).toHaveBeenCalledTimes(1);
    });

    it("calls scrollViewPercentual() utils to get scroll viewed percentual", () => {
      amplitudeJsTracker._logScrollMap();

      expect(scrollViewPercentual).toHaveBeenCalledTimes(1);
    });

    it("early returns if currentsSrollViewPercentual is lower than maxScreenViewedPercentual", () => {
      amplitudeJsTracker._logScrollMap();

      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("early returns if there is no scrollStep value elegible to log", () => {
      amplitudeJsTracker._maxScreenViewedPercentual = 20;
      scrollViewPercentual.mockReturnValue(30);

      amplitudeJsTracker._logScrollMap();

      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("sets correct maxScreenViewedPercentual", () => {
      amplitudeJsTracker._maxScreenViewedPercentual = 10;
      scrollViewPercentual.mockReturnValue(30);

      amplitudeJsTracker._logScrollMap();

      expect(amplitudeJsTracker._maxScreenViewedPercentual).toBe(20);
    });

    it("calls logEvent() with correct page scroll event name and properties", () => {
      const expectedName: string = "Page scroll";
      const expectedProperties: EventProperties = { value: 80 };

      amplitudeJsTracker._maxScreenViewedPercentual = 30;
      scrollViewPercentual.mockReturnValue(100);

      amplitudeJsTracker._logScrollMap();

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.logEvent).toHaveBeenLastCalledWith(
        expectedName,
        expectedProperties
      );
    });
  });

  describe("#trackScreenElementView", () => {
    const htmlElements: string = `
      <div class="${DEFAULT_ON_VIEWED_CLASS}"></div>
      <div class="${DEFAULT_ON_VIEWED_CLASS}"></div>
      <div class="${customViewedClass}"></div>
    `;

    let amplitudeJsTracker: AmplitudeJsTracker;
    let defaultTrackedScreenElements: Node[];
    let customTrackedScreenElements: Node[];

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._addScrollEventListener = jest.fn();

      document.body.innerHTML = htmlElements;
      defaultTrackedScreenElements = Array.from(
        document.querySelectorAll(DEFAULT_ON_VIEWED_SELECTOR)
      );
      customTrackedScreenElements = Array.from(
        document.querySelectorAll(customViewedSelector)
      );
    });

    it("uses options.onViewedSelector if no elementSelector is passed", () => {
      amplitudeJsTracker.options = {
        onViewedSelector: DEFAULT_ON_VIEWED_SELECTOR
      };

      const result: Node[] = amplitudeJsTracker.trackScreenElementView();

      expect(result.length).toEqual(2);
      expect(result).toEqual(defaultTrackedScreenElements);
    });

    it("uses elementSelector with precedence over options.onHoverSelector", () => {
      amplitudeJsTracker.options = {
        onHoverSelector: DEFAULT_ON_HOVER_SELECTOR
      };

      const result: Node[] = amplitudeJsTracker.trackScreenElementView(
        customViewedSelector
      );

      expect(result.length).toEqual(1);
      expect(result).toEqual(customTrackedScreenElements);
    });

    it("calls _addScrollEventListener()", () => {
      amplitudeJsTracker.trackScreenElementView();

      expect(amplitudeJsTracker._addScrollEventListener).toBeCalledTimes(1);
    });

    it("returns only targeted elements in Array", () => {
      let result: Node[];
      const expected: Node[] = Array.from(
        document.querySelectorAll(customViewedSelector)
      );

      amplitudeJsTracker.trackScreenElementView();
      result = amplitudeJsTracker.trackScreenElementView(customViewedSelector);

      expect(result.length).toEqual(1);
      expect(result).toEqual(expected);
    });

    it("concats new targeted elements with old ones in amplitudeJsTracker._trackedScreenElements", () => {
      amplitudeJsTracker.trackScreenElementView();
      amplitudeJsTracker.trackScreenElementView(customViewedSelector);

      const result = amplitudeJsTracker._trackedScreenElements;

      expect(result).toEqual(expect.arrayContaining(defaultTrackedScreenElements));
      expect(result).toEqual(expect.arrayContaining(customTrackedScreenElements));
    });
  });

  describe("#trackPerformanceMetrics", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      // @ts-ignore
      window.PerformanceObserver = {};

      mockCollectPerformanceMetrics.mockClear();
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("safe returns if window.PerformanceObserver is not supported", () => {
      // @ts-ignore
      window.PerformanceObserver = undefined;
      amplitudeJsTracker.trackPerformanceMetrics();

      expect(mockCollectPerformanceMetrics).not.toHaveBeenCalled();
    });

    it("calls collectPerformanceMetrics() and then _logPerformanceMetrics()", done => {
      amplitudeJsTracker._logPerformanceMetrics = jest.fn();
      amplitudeJsTracker.trackPerformanceMetrics();

      setTimeout(() => {
        expect(mockCollectPerformanceMetrics).toHaveBeenCalledTimes(1);
        expect(amplitudeJsTracker._logPerformanceMetrics).toHaveBeenCalledTimes(1);
        done();
      }, 0);
    });
  });

  describe("#_logPerformanceMetrics", () => {
    const amplitudeJsTracker: AmplitudeJsTracker = new AmplitudeJsTracker();
    amplitudeJsTracker.logEvent = jest.fn();

    it("calls logEvent() with correct performance metrics event name and properties", () => {
      const expectedName: string = "Performance metrics";
      const expectedProperties: PerformanceMetrics = {
        firstPaint: 200,
        firstContentfulPaint: 145,
        timeToInteractive: 231,
        timeToFirstByte: 1
      };

      amplitudeJsTracker._logPerformanceMetrics(expectedProperties);

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(1);
      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledWith(
        expectedName,
        expectedProperties
      );
    });
  });

  describe("#_logViewedElementEvent", () => {
    const isElementInView = jest.spyOn(AmplitudeJsUtils, "isElementInView");
    const htmlElements: string = `
      <div class="${DEFAULT_ON_VIEWED_CLASS}"></div>
      <div class="${DEFAULT_ON_VIEWED_CLASS}"></div>
    `;

    let amplitudeJsTracker: AmplitudeJsTracker;
    let defaultTrackedScreenElements: Node[];

    beforeEach(() => {
      isElementInView.mockReturnValue(true);

      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.logEvent = jest.fn();

      document.body.innerHTML = htmlElements;
      defaultTrackedScreenElements = Array.from(
        document.querySelectorAll(DEFAULT_ON_VIEWED_SELECTOR)
      );

      amplitudeJsTracker._trackedScreenElements = defaultTrackedScreenElements;
    });

    afterEach(() => {
      isElementInView.mockClear();
    });

    afterAll(() => {
      isElementInView.mockRestore();
    });

    it("returns false if amplitudeJsTracker._trackedScreenElements array is empty", () => {
      amplitudeJsTracker._trackedScreenElements = [];

      const result = amplitudeJsTracker._logViewedElementEvent();

      expect(result).toBe(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("returns false if there is no tracked element in view", () => {
      isElementInView.mockReturnValue(false);

      const result = amplitudeJsTracker._logViewedElementEvent();

      expect(result).toBe(false);
      expect(amplitudeJsTracker.logEvent).not.toHaveBeenCalled();
    });

    it("calls logEvent() for each tracked element in view with correct params", () => {
      const expectedName: string = "Viewed element";
      const expectedProperties: EventProperties = {
        description: "element on screen"
      };

      amplitudeJsTracker._propertiesFromTarget = jest
        .fn()
        .mockReturnValue(expectedProperties);

      amplitudeJsTracker._logViewedElementEvent();

      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledTimes(2);
      expect(amplitudeJsTracker.logEvent).toHaveBeenCalledWith(
        expectedName,
        expectedProperties
      );
    });

    it("removes logged viewed elements from tracking and returns true", () => {
      const result: boolean = amplitudeJsTracker._logViewedElementEvent();

      expect(result).toBe(true);
      expect(amplitudeJsTracker._trackedScreenElements).toEqual([]);
    });
  });

  describe("#_propertiesFromTarget", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();

      amplitudeJsTracker._excludedDataProperties = jest.fn().mockReturnValue([]);
    });

    it("returns undefined if element param has no dataset attribute", () => {
      const target: HTMLElement = {} as HTMLElement;

      const result:
        | EventProperties
        | undefined = amplitudeJsTracker._propertiesFromTarget(target);

      expect(result).toBe(undefined);
    });

    it("returns empty EventProperties if element param dataset is empty", () => {
      const htmlElement: string = `<div id="${elementId}"></div>`;
      document.body.innerHTML = htmlElement;

      const target: HTMLElement = document.getElementById(elementId) as HTMLElement;

      const expected: EventProperties = {};
      const result:
        | EventProperties
        | undefined = amplitudeJsTracker._propertiesFromTarget(target);

      expect(result).toEqual(expected);
    });

    it("returns all element dataset attributes as EventProperties", () => {
      const htmlElement: string = `<div id="${elementId}"
                             data-description="${dataDescription}"
                             data-href="${dataHref}">
                           </div>`;

      document.body.innerHTML = htmlElement;

      const target: HTMLElement = document.getElementById(elementId) as HTMLElement;

      const expected: EventProperties = {
        description: dataDescription,
        href: dataHref
      };
      const result:
        | EventProperties
        | undefined = amplitudeJsTracker._propertiesFromTarget(target);

      expect(result).toEqual(expected);
    });

    it("excludes all element properties returned by ", () => {
      (amplitudeJsTracker._excludedDataProperties as jest.Mock).mockReturnValue([
        "href"
      ]);

      const htmlElement: string = `<div id="${elementId}"
                             data-description="${dataDescription}"
                             data-href="${dataHref}">
                           </div>`;

      document.body.innerHTML = htmlElement;

      const target: HTMLElement = document.getElementById(elementId) as HTMLElement;

      const expected: EventProperties = {
        description: dataDescription
      };
      const result:
        | EventProperties
        | undefined = amplitudeJsTracker._propertiesFromTarget(target);

      expect(result).toEqual(expected);
    });
  });

  describe("#_excludedDataProperties", () => {
    const htmlElement: string = `<div id="${elementId}"
                                  data-description="${dataDescription}"
                                  data-href="${dataHref}">
                                </div>`;

    let amplitudeJsTracker: AmplitudeJsTracker;
    let element: HTMLElement;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker._excludedElementDataProperties = jest
        .fn()
        .mockReturnValue(["description"]);
      amplitudeJsTracker._excludedGlobalDataProperties = jest
        .fn()
        .mockReturnValue([DEFAULT_EXCLUDE_DATASET_KEY, "href"]);

      document.body.innerHTML = htmlElement;
      element = document.getElementById(elementId) as HTMLElement;
    });

    it("returns empty Array if options.excludedProperties is not defined and element has no amplitudeExclude dataset", () => {
      amplitudeJsTracker.options.excludedProperties = undefined;

      const result: string[] = amplitudeJsTracker._excludedDataProperties(element);

      expect(result).toEqual([]);
    });

    it("returns an Array with element's excluded properties if amplitudeExclude is defined", () => {
      const expected: string[] = ["description"];
      let result: string[];

      amplitudeJsTracker.options.excludedProperties = undefined;
      element.dataset.amplitudeExclude = "description";

      result = amplitudeJsTracker._excludedDataProperties(element);

      expect(amplitudeJsTracker._excludedElementDataProperties).toHaveBeenCalledTimes(
        1
      );
      expect(result).toEqual(expected);
    });

    it("returns an Array with element's global excluded properties if options.excludedProperties is defined", () => {
      const expected: string[] = [DEFAULT_EXCLUDE_DATASET_KEY, "href"];
      let result: string[];

      amplitudeJsTracker.options.excludedProperties = [/hr.*/];

      result = amplitudeJsTracker._excludedDataProperties(element);

      expect(amplitudeJsTracker._excludedGlobalDataProperties).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });
  });

  describe("#_excludedElementDataProperties", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("returns empty Array if no param received", () => {
      expect(amplitudeJsTracker._excludedElementDataProperties()).toEqual([]);
    });

    it("returns an Array with values from received param splited by comma", () => {
      const expectedSingle: string[] = ["key1"];

      expect(amplitudeJsTracker._excludedElementDataProperties("key1")).toEqual(
        expectedSingle
      );
      expect(amplitudeJsTracker._excludedElementDataProperties("[key1]")).toEqual(
        expectedSingle
      );
      expect(amplitudeJsTracker._excludedElementDataProperties(`["key1"]`)).toEqual(
        expectedSingle
      );
      expect(amplitudeJsTracker._excludedElementDataProperties(`['key1']`)).toEqual(
        expectedSingle
      );

      const expectedMultiple: string[] = ["key1", "key2", "key3"];

      expect(
        amplitudeJsTracker._excludedElementDataProperties("key1,key2,key3")
      ).toEqual(expectedMultiple);
      expect(
        amplitudeJsTracker._excludedElementDataProperties("key1, key2, key3")
      ).toEqual(expectedMultiple);
      expect(
        amplitudeJsTracker._excludedElementDataProperties("[key1, key2, key3]")
      ).toEqual(expectedMultiple);
      expect(
        amplitudeJsTracker._excludedElementDataProperties(`["key1", "key2", "key3"]`)
      ).toEqual(expectedMultiple);
      expect(
        amplitudeJsTracker._excludedElementDataProperties(`['key1', 'key2', 'key3']`)
      ).toEqual(expectedMultiple);
    });
  });

  describe("#_excludedGlobalDataProperties", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("returns Array with DEFAULT_EXCLUDE_DATASET_KEY if received param is empty", () => {
      const expected = [DEFAULT_EXCLUDE_DATASET_KEY];

      expect(amplitudeJsTracker._excludedGlobalDataProperties({})).toEqual(expected);
    });

    it("returns Array with DEFAULT_EXCLUDE_DATASET_KEY if options.excludedProperties is not defined", () => {
      const expected = [DEFAULT_EXCLUDE_DATASET_KEY];

      amplitudeJsTracker.options.excludedProperties = undefined;

      expect(
        amplitudeJsTracker._excludedGlobalDataProperties({ someProp: "" })
      ).toEqual(expected);
    });

    it("returns Array with DEFAULT_EXCLUDE_DATASET_KEY and matched options.excludedProperties from given dataProperties param", () => {
      const dataProperties: DatasetObject = {
        href: dataHref,
        description: dataDescription,
        "v-12398": "",
        "v-23212": ""
      };

      const expected = [DEFAULT_EXCLUDE_DATASET_KEY, "href", "v-12398", "v-23212"];

      amplitudeJsTracker.options.excludedProperties = [/hr.*/, /v-.*/];

      expect(amplitudeJsTracker._excludedGlobalDataProperties(dataProperties)).toEqual(
        expected
      );
    });
  });

  describe("#_parseDatasetEntries", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("returns dataset entries with 'numeric' keys as numbers", () => {
      const datasetEntries: DatasetEntry[] = [
        ["numericAmount", "42"],
        ["numericValue", undefined]
      ];
      const expectedEntries: ParsedDatasetEntry[] = [
        ["amount", 42],
        ["value", undefined]
      ];
      const result = amplitudeJsTracker._parseDatasetEntries(datasetEntries);

      expect(result).toEqual(expectedEntries);
    });

    it("returns dataset entries with 'boolean' keys as boolean value", () => {
      const datasetEntries: DatasetEntry[] = [
        ["booleanIsTrue", "false"],
        ["booleanIsFalse", undefined]
      ];
      const expectedEntries: ParsedDatasetEntry[] = [
        ["isTrue", false],
        ["isFalse", undefined]
      ];
      const result = amplitudeJsTracker._parseDatasetEntries(datasetEntries);

      expect(result).toEqual(expectedEntries);
    });

    it("returns unparsed dataset entries if no type is specified or value is undefined", () => {
      const datasetEntries: DatasetEntry[] = [
        ["descriptionText", "Some description in text"],
        ["undefinedProp", undefined]
      ];
      const result = amplitudeJsTracker._parseDatasetEntries(datasetEntries);

      expect(result).toEqual(datasetEntries);
    });

    it("returns all dataset entries parsed with different types", () => {
      const datasetEntries: DatasetEntry[] = [
        ["descriptionText", "Some description in text"],
        ["numericAmount", "42"],
        ["booleanIsTrue", "false"],
        ["undefinedProp", undefined]
      ];

      const expectedEntries: ParsedDatasetEntry[] = [
        ["descriptionText", "Some description in text"],
        ["amount", 42],
        ["isTrue", false],
        ["undefinedProp", undefined]
      ];

      const result = amplitudeJsTracker._parseDatasetEntries(datasetEntries);

      expect(result).toEqual(expectedEntries);
    });
  });

  describe("#_parseDatasetKey", () => {
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("returns camel-case string without provided term", () => {
      const forbiddenValue: RegExp = /^forbidden/;
      const unparsedKey: string = "forbiddenMasterKey";
      const expected: string = "masterKey";

      const result = amplitudeJsTracker._parseDatasetKey(unparsedKey, forbiddenValue);

      expect(result).toEqual(expected);
    });
  });

  describe("#_defaultEventProperties", () => {
    const useDefaultEventProperties: UseDefaultEventProperties = {
      origin: true,
      pagePath: false
    };

    let defaultOptions: jest.SpyInstance;
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    beforeAll(() => {
      defaultOptions = jest
        .spyOn(AmplitudeTypes, "DEFAULT_OPTIONS")
        .mockImplementation(() => ({ useDefaultEventProperties }));
    });

    afterAll(() => {
      defaultOptions.mockRestore();
    });

    it("returns only default event properties set to true in useDefaultEventProperties", () => {
      let result: DefaultEventProperties;
      let expected: DefaultEventProperties;
      let useDefaultEventProperties: UseDefaultEventProperties;

      useDefaultEventProperties = {
        origin: false,
        pagePath: true
      };

      expected = { pagePath: pathname };

      amplitudeJsTracker.options = { useDefaultEventProperties };
      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual(expected);

      useDefaultEventProperties = {
        origin: true,
        pagePath: false
      };

      expected = { origin };

      amplitudeJsTracker.options = { useDefaultEventProperties };
      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual(expected);
    });

    it("returns empty DefaultEventProperties if all properties in useDefaultEventProperties are set to false", () => {
      const useDefaultEventProperties: UseDefaultEventProperties = {
        origin: false,
        pagePath: false
      };
      let result: DefaultEventProperties;

      amplitudeJsTracker.options = { useDefaultEventProperties };
      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual({});
    });

    it("returns empty DefaultEventProperties if options.useDefaultEventProperties and DEFAULT_OPTIONS().useDefaultEventProperties are undefined", () => {
      let result: DefaultEventProperties;

      defaultOptions.mockReturnValueOnce({});
      amplitudeJsTracker.options = { useDefaultEventProperties: undefined };

      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual({});
    });

    it("uses DEFAULT_OPTIONS().useDefaultEventProperties if options.useDefaultEventProperties is not defined", () => {
      const expected: DefaultEventProperties = { origin };
      let result: DefaultEventProperties;

      amplitudeJsTracker.options = { useDefaultEventProperties: undefined };
      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual(expected);
    });

    it("uses options.useDefaultEventProperties with precedence over DEFAULT_OPTIONS().useDefaultEventProperties", () => {
      const useDefaultEventProperties: UseDefaultEventProperties = {
        origin: false,
        pagePath: true
      };
      const expected: DefaultEventProperties = { pagePath: pathname };
      let result: DefaultEventProperties;

      amplitudeJsTracker.options = { useDefaultEventProperties };
      result = amplitudeJsTracker._defaultEventProperties();

      expect(result).toEqual(expected);
    });
  });

  describe("#_addScrollEventListener", () => {
    it("calls _scrollEventHandler() and adds a passive scroll event listener to window", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();
      const passiveOptions: AddEventListenerOptions = {
        capture: true,
        passive: true
      };

      amplitudeJsTracker._scrollEventHandler = jest.fn();
      window.addEventListener = jest.fn();

      amplitudeJsTracker._addScrollEventListener();

      expect(window.addEventListener).toHaveBeenCalledTimes(1);
      expect(window.addEventListener).toHaveBeenCalledWith(
        "scroll",
        amplitudeJsTracker._scrollEventHandler,
        passiveOptions
      );
      expect(amplitudeJsTracker._scrollEventHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("#_scrollEventHandler", () => {
    const currentScrollTimeout: number = 666;
    const scrollTimeout = 1000;

    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
    });

    it("clears scroll timeout if it exists", () => {
      window.clearTimeout = jest.fn();

      amplitudeJsTracker._currentScrollTimeout = currentScrollTimeout;

      amplitudeJsTracker._scrollEventHandler();

      expect(window.clearTimeout).toHaveBeenCalledTimes(1);
      expect(window.clearTimeout).toHaveBeenCalledWith(currentScrollTimeout);
    });

    it("sets new scroll timeout to expire in options.scrollTimeout ms", () => {
      amplitudeJsTracker._logScreenViews = jest.fn();
      window.setTimeout = jest.fn().mockReturnValue(currentScrollTimeout);

      amplitudeJsTracker.options.scrollTimeout = scrollTimeout;

      amplitudeJsTracker._scrollEventHandler();

      expect(window.setTimeout).toHaveBeenCalledTimes(1);
      expect(window.setTimeout).toHaveBeenCalledWith(
        amplitudeJsTracker._logScreenViews,
        scrollTimeout
      );
      expect(amplitudeJsTracker._currentScrollTimeout).toBe(currentScrollTimeout);
    });
  });

  describe("#_descendingScrollSteps", () => {
    let defaultOptions: jest.SpyInstance;
    let amplitudeJsTracker: AmplitudeJsTracker;

    beforeEach(() => {
      amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.options.scrollSteps = [10, 20, 30, 40];
    });

    beforeAll(() => {
      defaultOptions = jest
        .spyOn(AmplitudeTypes, "DEFAULT_OPTIONS")
        .mockImplementation(() => ({ scrollSteps: [25, 50, 75, 100] }));
    });

    afterAll(() => {
      defaultOptions.mockRestore();
    });

    it("returns options.scrollSteps in descending order", () => {
      const expected: number[] = [40, 30, 20, 10];
      const result: number[] = amplitudeJsTracker._descendingScrollSteps();

      expect(result).toEqual(expected);
    });

    it("uses DEFAULT_OPTIONS.scrollSteps if options.scrollSteps is not defined", () => {
      const expected: number[] = [100, 75, 50, 25];
      let result: number[];

      amplitudeJsTracker.options.scrollSteps = undefined;

      result = amplitudeJsTracker._descendingScrollSteps();

      expect(result).toEqual(expected);
    });

    it("uses options.scrollSteps with precedence over DEFAULT_OPTIONS.scrollSteps", () => {
      const expected: number[] = [40, 30, 20, 10];
      let result: number[];

      result = amplitudeJsTracker._descendingScrollSteps();

      expect(result).toEqual(expected);
    });

    it("returns empty array if no options.scrollSteps or DEFAULT_OPTIONS.scrollSteps are defined", () => {
      amplitudeJsTracker.options.scrollSteps = undefined;
      defaultOptions.mockReturnValue([]);

      const result: number[] = amplitudeJsTracker._descendingScrollSteps();

      expect(result).toEqual([]);
    });
  });

  describe("#_afterInitialize", () => {
    it("sets instanceInitialized = true and calls processQueue()", () => {
      const amplitudeJsTracker = new AmplitudeJsTracker();
      amplitudeJsTracker.processQueue = jest.fn();

      expect(amplitudeJsTracker._instanceInitialized).toBe(false);

      amplitudeJsTracker._afterInitialize();

      expect(amplitudeJsTracker._instanceInitialized).toBe(true);
      expect(amplitudeJsTracker.processQueue).toHaveBeenCalledTimes(1);
    });
  });
});
