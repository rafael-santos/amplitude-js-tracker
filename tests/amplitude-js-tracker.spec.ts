import AmplitudeJsTracker from "../src/amplitude-js-tracker";

describe("AmplitudeJsTracker", () => {
  it("Works", () => {
    const tracker = new AmplitudeJsTracker();

    expect(tracker).toBeDefined();
  });
});
