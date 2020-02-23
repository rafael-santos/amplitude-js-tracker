export const isElementVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  const hidden: string | null = element.getAttribute("hidden");
  const { visibility, opacity, display } = getComputedStyle(element);

  const isHidden: boolean = typeof hidden === "string";
  const isInvisible: boolean =
    visibility === "hidden" || visibility === "collapsed";
  const isTransparent: boolean =
    opacity && parseFloat(opacity) <= 0.05 ? true : false;
  const isDisplayNone: boolean = display === "none";

  return !(isHidden || isInvisible || isTransparent || isDisplayNone);
};

export const isElementInView = (
  element: HTMLElement | null,
  partialyVisible: boolean = false,
  minVisibleHeight: number = 24
): boolean => {
  if (!element || !isElementVisible) return false;

  const viewportTop: number = window.pageYOffset;
  const viewportBottom: number = viewportTop + window.innerHeight;

  const elementRect: DOMRect | ClientRect = element.getBoundingClientRect();
  const elementTop: number = elementRect.top;
  const elementBottom: number = elementTop + elementRect.height;

  if (partialyVisible) {
    return (
      elementTop + minVisibleHeight <= viewportBottom &&
      elementBottom - minVisibleHeight >= viewportTop
    );
  }

  return elementTop >= 0 && elementBottom <= viewportBottom;
};

export const scrollViewPercentual = (): number => {
  const viewportTop: number = window.pageYOffset;
  const viewportBottom: number = viewportTop + window.innerHeight;
  const documentHeight: number = document.body.clientHeight;

  const viewedPercentage: number = (viewportBottom / documentHeight) * 100;

  return viewedPercentage;
};
