import "@testing-library/jest-dom";

// Polyfill ResizeObserver for components that measure layout (e.g. line-clamp overflow)
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    class ResizeObserverPolyfill {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        queueMicrotask(() => {
          this.callback(
            [
              {
                target,
                contentRect: {} as DOMRectReadOnly,
                borderBoxSize: [],
                contentBoxSize: [],
                devicePixelContentBoxSize: [],
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          );
        });
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
}

// Polyfill IntersectionObserver for components using scroll reveal in JSDOM
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  // minimal stub that immediately calls back with isIntersecting=true
  const MockIntersectionObserver: any = class {
    callback: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.callback = cb;
    }
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as any);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };

  (window as any).IntersectionObserver = MockIntersectionObserver;
}

