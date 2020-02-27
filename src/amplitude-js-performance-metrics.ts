import ttiPolyfill from "tti-polyfill";
import { PerformanceMetrics, PaintMetric } from "./@types/amplitude-js-tracker";

class AmplitudeJsPerformanceMetrics {
  peformanceMetricsProperties: PerformanceMetrics = {
    firstPaint: undefined,
    firstContentfulPaint: undefined,
    timeToInteractive: undefined,
    timeToFirstByte: undefined
  };

  constructor() {
    this._performanceObserverCallback = this._performanceObserverCallback.bind(this);
  }

  collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    this._collectPaintMetrics();
    this._collectTimeToInteractive();
    this._collectTimeToFirstByte();

    const promise: Promise<PerformanceMetrics> = new Promise(resolve => {
      this._resolveAllMetrics(resolve);
    });

    return promise;
  }

  _resolveAllMetrics(resolve: Function): void {
    const allMetrics: string[] = Object.keys(this.peformanceMetricsProperties);
    const collectedMetrics: number[] = Object.values(
      this.peformanceMetricsProperties
    ).filter(value => value !== undefined);

    if (collectedMetrics.length == allMetrics.length) {
      resolve(this.peformanceMetricsProperties);
    } else {
      setTimeout(() => this._resolveAllMetrics(resolve), 2000);
    }
  }

  _collectPaintMetrics(): void {
    const observer: PerformanceObserver = new PerformanceObserver(
      this._performanceObserverCallback
    );
    observer.observe({ entryTypes: ["paint"] });
  }

  _performanceObserverCallback(entries: PerformanceObserverEntryList): void {
    entries.getEntries().forEach((entry: PerformanceEntry) => {
      const { name: metricName, startTime, duration } = entry;
      const time: number = Math.round(startTime + duration);

      if (metricName === PaintMetric.FIRST_PAINT)
        this.peformanceMetricsProperties.firstPaint = time;
      if (metricName === PaintMetric.FIRST_CONTENTFUL_PAINT)
        this.peformanceMetricsProperties.firstContentfulPaint = time;
    });
  }

  _collectTimeToInteractive(): void {
    ttiPolyfill.getFirstConsistentlyInteractive().then((tti: number | null) => {
      if (typeof tti === "number")
        this.peformanceMetricsProperties.timeToInteractive = Math.round(tti);
    });
  }

  _collectTimeToFirstByte(): void {
    this.peformanceMetricsProperties.timeToFirstByte =
      performance.timing.responseStart - performance.timing.requestStart;
  }
}

export default AmplitudeJsPerformanceMetrics;
