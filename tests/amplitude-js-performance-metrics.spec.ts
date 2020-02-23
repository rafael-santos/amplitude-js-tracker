import ttiPolyfill, { getFirstConsistentlyInteractive } from "tti-polyfill";

import AmplitudeJsPerformanceMetrics from "@/amplitude-js-performance-metrics";
import { PerformanceMetrics } from "@/@types/amplitude-js-tracker";

let amplitudeJsPerformanceMetrics: AmplitudeJsPerformanceMetrics;

beforeEach(() => {
  amplitudeJsPerformanceMetrics = new AmplitudeJsPerformanceMetrics();
});

describe("#collectPerformanceMetrics", () => {
  beforeEach(() => {
    amplitudeJsPerformanceMetrics._collectPaintMetrics = jest.fn();
    amplitudeJsPerformanceMetrics._collectTimeToInteractive = jest.fn();
    amplitudeJsPerformanceMetrics._collectTimeToFirstByte = jest.fn();
    amplitudeJsPerformanceMetrics._resolveAllMetrics = jest.fn();
  });

  it("calls collect metrics methods", () => {
    amplitudeJsPerformanceMetrics.collectPerformanceMetrics();

    expect(
      amplitudeJsPerformanceMetrics._collectPaintMetrics
    ).toHaveBeenCalledTimes(1);
    expect(
      amplitudeJsPerformanceMetrics._collectTimeToInteractive
    ).toHaveBeenCalledTimes(1);
    expect(
      amplitudeJsPerformanceMetrics._collectTimeToFirstByte
    ).toHaveBeenCalledTimes(1);
  });

  it("returns a promise and calls _resolveAllMetrics() to resolve the promise", () => {
    const expected: PerformanceMetrics = { timeToFirstByte: 123 };

    (amplitudeJsPerformanceMetrics._resolveAllMetrics as jest.Mock).mockImplementation(
      resolve => resolve(expected)
    );

    const result: Promise<PerformanceMetrics> = amplitudeJsPerformanceMetrics.collectPerformanceMetrics();

    return expect(result).resolves.toEqual(expected);
  });
});

describe("#_resolveAllMetrics", () => {
  let resolve: jest.Mock;
  let peformanceMetricsProperties: PerformanceMetrics;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    resolve = jest.fn();

    peformanceMetricsProperties = {
      firstPaint: 0,
      firstContentfulPaint: 123,
      timeToInteractive: 100,
      timeToFirstByte: 456
    };

    jest.spyOn(amplitudeJsPerformanceMetrics, "_resolveAllMetrics");
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("calls resolve() function with peformanceMetricsProperties if all its keys have defined values", () => {
    amplitudeJsPerformanceMetrics.peformanceMetricsProperties = peformanceMetricsProperties;
    amplitudeJsPerformanceMetrics._resolveAllMetrics(resolve);

    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it("calls itself after 2s if any peformanceMetricsProperties keys are undefined", () => {
    amplitudeJsPerformanceMetrics.peformanceMetricsProperties = peformanceMetricsProperties;
    amplitudeJsPerformanceMetrics.peformanceMetricsProperties.firstContentfulPaint = undefined;

    amplitudeJsPerformanceMetrics._resolveAllMetrics(resolve);

    expect(resolve).not.toHaveBeenCalled();
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

    jest.runOnlyPendingTimers();

    expect(
      amplitudeJsPerformanceMetrics._resolveAllMetrics
    ).toHaveBeenCalledTimes(2);
  });
});

describe("#_performanceObserverCallback", () => {
  const firstPaintEntry: PerformanceEntry = {
    duration: 1234,
    entryType: "paint",
    name: "first-paint",
    startTime: 123,
    toJSON: () => {}
  };

  const firstContentfulPaintEntry: PerformanceEntry = {
    duration: 3453,
    entryType: "paint",
    name: "first-contentful-paint",
    startTime: 12,
    toJSON: () => {}
  };

  const entries: PerformanceObserverEntryList = {
    getEntries: jest.fn(() => [firstPaintEntry, firstContentfulPaintEntry]),
    getEntriesByName: jest.fn(),
    getEntriesByType: jest.fn()
  };

  it("sets firstPaint and firstContentfulPaint attributes of peformanceMetricsProperties for givin entries", () => {
    const expectedFirstPaint: number = Math.round(
      firstPaintEntry.startTime + firstPaintEntry.duration
    );
    const expectedFirstContentfulPaint: number = Math.round(
      firstContentfulPaintEntry.startTime + firstContentfulPaintEntry.duration
    );

    amplitudeJsPerformanceMetrics._performanceObserverCallback(entries);

    const {
      firstPaint,
      firstContentfulPaint
    } = amplitudeJsPerformanceMetrics.peformanceMetricsProperties;

    expect(firstPaint).toEqual(expectedFirstPaint);
    expect(firstContentfulPaint).toEqual(expectedFirstContentfulPaint);
  });
});

describe("#_collectTimeToInteractive", () => {
  let mockSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSpy = jest.spyOn(ttiPolyfill, "getFirstConsistentlyInteractive");
  });

  afterAll(() => {
    mockSpy.mockRestore();
  });

  it("sets timeToInteractive attribute of peformanceMetricsProperties if a number is received", done => {
    const expected: number = 123;
    mockSpy.mockResolvedValue(expected);

    amplitudeJsPerformanceMetrics._collectTimeToInteractive();

    setTimeout(() => {
      expect(
        amplitudeJsPerformanceMetrics.peformanceMetricsProperties
          .timeToInteractive
      ).toEqual(expected);
      done();
    }, 0);
  });

  it("does not sets timeToInteractive attribute of peformanceMetricsProperties if null is received", done => {
    mockSpy.mockResolvedValue(null);

    amplitudeJsPerformanceMetrics._collectTimeToInteractive();

    setTimeout(() => {
      expect(
        amplitudeJsPerformanceMetrics.peformanceMetricsProperties
          .timeToInteractive
      ).toEqual(undefined);
      done();
    }, 0);
  });
});

describe("#_collectTimeToFirstByte", () => {
  Object.assign(window.performance, {
    timing: {
      responseStart: 1000,
      requestStart: 2000
    }
  });

  it("sets timeToFirstByte attribute of peformanceMetricsProperties", () => {
    const expected: number =
      window.performance.timing.responseStart -
      window.performance.timing.requestStart;

    amplitudeJsPerformanceMetrics._collectTimeToFirstByte();

    expect(
      amplitudeJsPerformanceMetrics.peformanceMetricsProperties.timeToFirstByte
    ).toEqual(expected);
  });
});
