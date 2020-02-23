import amplitude from "amplitude-js";

export const DEFAULT_ON_CLICK_CLASS: string = "js-amplitude-click";
export const DEFAULT_ON_CLICK_SELECTOR: string = `.${DEFAULT_ON_CLICK_CLASS}`;
export const DEFAULT_ON_HOVER_CLASS: string = "js-amplitude-hover";
export const DEFAULT_ON_HOVER_SELECTOR: string = `.${DEFAULT_ON_HOVER_CLASS}`;
export const DEFAULT_ON_VIEWED_CLASS: string = "js-amplitude-viewed";
export const DEFAULT_ON_VIEWED_SELECTOR: string = `.${DEFAULT_ON_VIEWED_CLASS}`;
export const DEFAULT_SCROLL_TIMEOUT: number = 100;

export const DEFAULT_USE_DEFAULT_EVENT_PROPERTIES: Function = (): UseDefaultEventProperties => ({
  origin: true,
  pagePath: true
});

export const NUMERIC_EVENT_PROPERTIES: Function = (): string[] => ["page"];

export const DEFAULT_EXCLUDE_DATASET_KEY: string = "amplitudeExclude";
export const DEFAULT_EXCLUDE_PROPERTIES: RegExp[] = [/v-.*/g];

export const DEFAULT_SCROLL_STEPS: Function = (): number[] => [
  100,
  75,
  50,
  25,
  10
];

export const DEFAULT_OPTIONS = (): Options => ({
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
});

export interface Options extends amplitude.Config {
  instanceName?: string;
  userId?: string;
  domain?: string;
  eventPrefix?: string;
  fixedEventProperties?: FixedEventProperties;
  useDefaultEventProperties?: UseDefaultEventProperties;
  onClickSelector?: string;
  onHoverSelector?: string;
  onViewedSelector?: string;
  numericDatasetProperties?: string[];
  scrollSteps?: number[];
  scrollTimeout?: number;
  includeReferrer?: boolean;
  includeUtm?: boolean;
  excludedProperties?: RegExp[];
}

export interface AmplitudeEvent {
  name: string;
  properties: EventProperties;
}

export interface FixedEventProperties {
  [key: string]: any;
}

export interface UseDefaultEventProperties {
  origin?: boolean;
  pagePath?: boolean;
}
export interface DefaultEventProperties {
  origin?: string;
  pagePath?: string;
}

export interface EventProperties
  extends DefaultEventProperties,
    PerformanceMetrics {
  description?: string;
  value?: number;
  href?: string;
  page?: string;
}

export interface PerformanceMetrics {
  firstPaint?: number;
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  timeToFirstByte?: number;
}

export type DatasetObject = Record<string, string | undefined>;
export type DatasetEntry = [string, string | undefined];
export type ParsedDatasetEntry = [
  string,
  string | number | boolean | undefined
];

export enum PaintMetric {
  FIRST_PAINT = "first-paint",
  FIRST_CONTENTFUL_PAINT = "first-contentful-paint"
}

export enum TrackableEvent {
  CLICK = "click",
  SCROLL = "scroll",
  MOUSE_ENTER = "mouseenter"
}

export enum AmplitudeJsTrackerEvent {
  PAGE_VIEW = "Viewed ${pageName} page",
  ELEMENT_CLICK = "Click on element",
  ELEMENT_HOVER = "Hover on element",
  ELEMENT_VIEW = "Viewed element",
  PAGE_SCROLL = "Page scroll",
  PERFORMANCE_METRICS = "Performance metrics"
}
