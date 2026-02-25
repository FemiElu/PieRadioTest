import "@testing-library/jest-dom";

// Polyfill IntersectionObserver for components using scroll reveal in JSDOM
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  // minimal stub that immediately calls back with isIntersecting=true
  (window as any).IntersectionObserver = class IntersectionObserver {
    callback: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.callback = cb;
    }
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
}

