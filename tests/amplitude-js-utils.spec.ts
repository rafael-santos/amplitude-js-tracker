import {
  isElementVisible,
  isElementInView,
  scrollViewPercentual
} from "@/amplitude-js-utils";

const DEFAULT_SCROLL_TOP: number = 0;
const DEFAULT_VIEWPORT_HEIGHT: number = 800;
const DEFAULT_CLIENT_RECT: Function = (): ClientRect => ({
  height: 100,
  width: 200,
  bottom: 100,
  left: 0,
  right: 200,
  top: 0
});

const _setScrollTopPosition = (scrollTopPosition: number = 0) => {
  // @ts-ignore read-only property
  window.pageYOffset = scrollTopPosition;

  _updateElementPosition(elementClientRect.top - scrollTopPosition);
};

const _setViewportHeight = (viewportHeight: number) => {
  // @ts-ignore read-only property
  window.innerHeight = viewportHeight;
};

const _updateElementPosition = (top?: number, bottom?: number) => {
  if (!elementClientRect) return;

  if (top || top === 0) {
    elementClientRect.top = top;
    elementClientRect.bottom = elementClientRect.top + elementClientRect.height;
  } else if (bottom || bottom === 0) {
    elementClientRect.bottom = bottom;
    elementClientRect.top = elementClientRect.bottom - elementClientRect.height;
  }
};

let element: HTMLElement | null;
let elementClientRect: ClientRect;

beforeEach(() => {
  elementClientRect = DEFAULT_CLIENT_RECT();

  _setScrollTopPosition(DEFAULT_SCROLL_TOP);
  _setViewportHeight(DEFAULT_VIEWPORT_HEIGHT);
});

describe("#isElementVisible", () => {
  it("returns false if element param is not defined", () => {
    const element: unknown = undefined;

    expect(isElementVisible(null)).toBe(false);
    expect(isElementVisible(element as HTMLElement)).toBe(false);
  });

  it("returns false if element's visibility, opacity or display prevent user from seeing it", () => {
    const htmlElements: string = `
      <div id="hidden" hidden>Hidden attribute div</div>
      <div id="visibility-hidden" style="visibility: hidden">Visibility hidden div</div>
      <div id="visibility-collapsed" style="visibility: collapsed">Visibility collapsed div</div>
      <div id="opacity-0" style="opacity:0">Opacity 0 div</div>
      <div id="display-none" style="display:none">Display none div</div>
    `;

    document.body.innerHTML = htmlElements;

    const elementHidden: HTMLElement | null = document.getElementById("hidden");
    const elementVisibilityHidden: HTMLElement | null = document.getElementById(
      "visibility-hidden"
    );
    const elementVisibilityCollapsed: HTMLElement | null = document.getElementById(
      "visibility-collapsed"
    );
    const elementOpacity0: HTMLElement | null = document.getElementById(
      "opacity-0"
    );
    const elementDisplayNone: HTMLElement | null = document.getElementById(
      "display-none"
    );

    expect(isElementVisible(elementHidden)).toBe(false);
    expect(isElementVisible(elementVisibilityHidden)).toBe(false);
    expect(isElementVisible(elementVisibilityCollapsed)).toBe(false);
    expect(isElementVisible(elementOpacity0)).toBe(false);
    expect(isElementVisible(elementDisplayNone)).toBe(false);
  });

  it("returns true if is defined and attributes does not hide it", () => {
    const htmlElements: string = `<div id="visible">Hidden attribute div</div>`;

    document.body.innerHTML = htmlElements;

    const elementVisible: HTMLElement | null = document.getElementById(
      "visible"
    );

    expect(isElementVisible(elementVisible)).toBe(true);
  });
});

describe("#isElementInView", () => {
  const htmlElements: string = `<div id="element">Dummy element</div>`;
  const getBoundingClientRectMock: jest.Mock = jest.fn(() => elementClientRect);

  beforeEach(() => {
    document.body.innerHTML = htmlElements;
    element = document.getElementById("element");
    (element as HTMLElement).getBoundingClientRect = getBoundingClientRectMock;
  });

  it("returns false if element param is null or undefined", () => {
    const result: boolean = isElementInView(null);

    expect(result).toBe(false);
  });

  it("returns true if element is fully visible in viewport", () => {
    const result: boolean = isElementInView(element);

    expect(result).toBe(true);
  });

  it("returns false if element's top is not visible in viewport", () => {
    let result: boolean;

    _setScrollTopPosition(10);

    result = isElementInView(element);
    expect(result).toBe(false);
  });

  it("returns false if element's bottom is not visible in viewport", () => {
    let result: boolean;

    _updateElementPosition(undefined, DEFAULT_VIEWPORT_HEIGHT + 10);

    result = isElementInView(element);
    expect(result).toBe(false);
  });

  describe("when testing partialy visible element", () => {
    const partialyVisible: boolean = true;
    const minVisibleHeight: number = 10;

    it("returns true if element top is at least minimum distant from page bottom", () => {
      let result: boolean;

      _updateElementPosition(DEFAULT_VIEWPORT_HEIGHT - 15);

      result = isElementInView(element, partialyVisible, minVisibleHeight);
      expect(result).toBe(true);
    });

    it("returns false if element top is not at least minimum distant from page bottom", () => {
      let result: boolean;

      _updateElementPosition(DEFAULT_VIEWPORT_HEIGHT - 5);

      result = isElementInView(element, partialyVisible, minVisibleHeight);
      expect(result).toBe(false);
    });

    it("returns true if element bottom is at least minimum distant from page top", () => {
      let result: boolean;

      _updateElementPosition(undefined, 15);

      result = isElementInView(element, partialyVisible, minVisibleHeight);
      expect(result).toBe(true);
    });

    it("returns false if element bottom is not at least minimum distant from page top", () => {
      let result: boolean;

      _updateElementPosition(undefined, 5);

      result = isElementInView(element, partialyVisible, minVisibleHeight);
      expect(result).toBe(false);
    });
  });
});

describe("#scrollViewPercentual", () => {
  beforeEach(() => {
    const mockedClientHeigh: PropertyDescriptor = {
      configurable: true,
      value: 1000
    };

    Object.defineProperty(
      HTMLElement.prototype,
      "clientHeight",
      mockedClientHeigh
    );

    _setViewportHeight(100);
  });

  it("returns correct page view scrolled percentage", () => {
    let result: number;

    result = scrollViewPercentual();
    expect(result).toBe(10);

    _setScrollTopPosition(10);

    result = scrollViewPercentual();
    expect(result).toBe(11);

    _setScrollTopPosition(400);

    result = scrollViewPercentual();
    expect(result).toBe(50);

    _setScrollTopPosition(900);

    result = scrollViewPercentual();
    expect(result).toBe(100);
  });
});
