import { beforeAll, describe, expect, test, vi } from "vitest";

type DynamicInjectModule = {
  canRetryEmptyDynamicFeed: (
    retryTimestamps: number[],
    now: number,
    retryLimit?: number,
    retryWindowMs?: number,
  ) => boolean;
  default: string;
  isSpaceDynamicFeedUrl: (url: string | undefined) => boolean;
  shouldReloadEmptyDynamicFeedPayload: (payload: unknown) => boolean;
};

let injectCode: DynamicInjectModule;

beforeAll(async () => {
  vi.stubGlobal("__DEV__", false);
  injectCode = (await import("./inject")) as DynamicInjectModule;
});

describe("Dynamic injected script helpers", () => {
  test("detects only the first page of the Bilibili space dynamic feed api", () => {
    expect(
      injectCode.isSpaceDynamicFeedUrl(
        "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1625060795",
      ),
    ).toBe(true);
    expect(
      injectCode.isSpaceDynamicFeedUrl(
        "/x/polymer/web-dynamic/v1/feed/space?offset&host_mid=1625060795",
      ),
    ).toBe(true);
    expect(
      injectCode.isSpaceDynamicFeedUrl(
        "/x/polymer/web-dynamic/v1/feed/space?offset=1102755599446179875&host_mid=1625060795",
      ),
    ).toBe(false);
    expect(
      injectCode.isSpaceDynamicFeedUrl("/x/polymer/web-dynamic/v1/feed/space?host_mid=1625060795"),
    ).toBe(false);
    expect(injectCode.isSpaceDynamicFeedUrl("https://api.bilibili.com/x/space/upstat")).toBe(false);
  });

  test("reloads only when dynamic feed items are empty", () => {
    expect(
      injectCode.shouldReloadEmptyDynamicFeedPayload({
        code: 0,
        data: {
          items: [],
        },
      }),
    ).toBe(true);
    expect(
      injectCode.shouldReloadEmptyDynamicFeedPayload({
        code: 0,
        data: {
          items: [{ id_str: "1102755599446179875" }],
        },
      }),
    ).toBe(false);
    expect(injectCode.shouldReloadEmptyDynamicFeedPayload({ code: -352 })).toBe(false);
  });

  test("limits empty feed reloads to five attempts in a short window", () => {
    const now = 10_000;
    const oneMinute = 60_000;

    expect(
      injectCode.canRetryEmptyDynamicFeed(
        [now - 50_000, now - 40_000, now - 30_000, now - 20_000],
        now,
        5,
        oneMinute,
      ),
    ).toBe(true);
    expect(
      injectCode.canRetryEmptyDynamicFeed(
        [now - 50_000, now - 40_000, now - 30_000, now - 20_000, now - 10_000],
        now,
        5,
        oneMinute,
      ),
    ).toBe(false);
    expect(
      injectCode.canRetryEmptyDynamicFeed(
        [now - 70_000, now - 40_000, now - 30_000, now - 20_000, now - 10_000],
        now,
        5,
        oneMinute,
      ),
    ).toBe(true);
  });

  test("default injected script executes __$inject without external function arguments", () => {
    expect(injectCode.default).toContain("function __$inject()");
    expect(injectCode.default).toContain(")();true;");
    expect(injectCode.default).not.toContain("function isSpaceDynamicFeedUrl");
    expect(injectCode.default).not.toContain("function shouldReloadEmptyDynamicFeedPayload");
    expect(injectCode.default).not.toContain("function canRetryEmptyDynamicFeed");
  });

  test("does not reload from empty page dom without an empty feed response", () => {
    type FakeElement = {
      childElementCount: number;
      children: FakeElement[];
      className: string;
      id: string;
      innerHTML: string;
      listeners: Record<string, (event: Event) => void>;
      parentNode?: FakeElement;
      setAttribute: (name: string, value: string) => void;
      addEventListener: (type: string, handler: (event: Event) => void) => void;
      appendChild: (child: FakeElement) => FakeElement;
      dispatchEvent: (event: Event) => void;
      style: Record<string, string>;
      tagName: string;
      textContent: string;
    };

    const elementsById = new Map<string, FakeElement>();

    function createFakeElement(tagName: string): FakeElement {
      const element: FakeElement = {
        childElementCount: 0,
        children: [],
        className: "",
        id: "",
        innerHTML: "",
        listeners: {},
        setAttribute(name, value) {
          if (name === "id") {
            this.id = value;
          }
        },
        addEventListener(type, handler) {
          this.listeners[type] = handler;
        },
        appendChild(child) {
          child.parentNode = this;
          this.children.push(child);
          this.childElementCount = this.children.length;
          if (child.id) {
            elementsById.set(child.id, child);
          }
          return child;
        },
        dispatchEvent(event) {
          this.listeners[event.type]?.(event);
        },
        style: {},
        tagName,
        textContent: "",
      };

      return element;
    }

    const head = createFakeElement("head");
    const body = createFakeElement("body");
    const dynamicList = createFakeElement("div");
    const listWrap = createFakeElement("div");
    const noMore = createFakeElement("div");
    const reload = vi.fn();
    const document = {
      body,
      createElement: createFakeElement,
      getElementById(id: string) {
        return elementsById.get(id) ?? null;
      },
      head,
      querySelector(selector: string) {
        if (selector === ".no-more") {
          return noMore;
        }
        if (selector === ".m-space .list") {
          return dynamicList;
        }
        if (selector === ".list-scroll-content-wrap") {
          return listWrap;
        }
        return null;
      },
      querySelectorAll(selector: string) {
        if (selector === ".bili-dyn-item") {
          return [];
        }
        return [];
      },
    };
    const location = {
      pathname: "/space/1625060795",
      reload,
    };
    const sessionStorage = {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    const window = {
      addEventListener: vi.fn(),
      document,
      fetch: undefined,
      location,
      sessionStorage,
      setTimeout: (handler: () => void) => {
        handler();
        return 1;
      },
    };

    vi.stubGlobal("document", document);
    vi.stubGlobal("location", location);
    vi.stubGlobal("setInterval", vi.fn());
    vi.stubGlobal("window", window);

    Function(injectCode.default)();

    expect(reload).not.toHaveBeenCalled();
  });

  test("default injected script reloads after fetch returns empty feed items", async () => {
    const reload = vi.fn();
    const elementsById = new Map<string, { id: string }>();
    const head = {
      appendChild: vi.fn(),
    };
    const body = {
      addEventListener: vi.fn(),
      appendChild: vi.fn((child: { id: string }) => {
        elementsById.set(child.id, child);
        return child;
      }),
    };
    const document = {
      body,
      createElement(tagName: string) {
        return {
          addEventListener: vi.fn(),
          className: "",
          id: "",
          innerHTML: "",
          setAttribute: vi.fn(),
          style: {},
          tagName,
          textContent: "",
        };
      },
      getElementById(id: string) {
        return elementsById.get(id) ?? null;
      },
      head,
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
    };
    const location = {
      pathname: "/space/1625060795",
      reload,
    };
    const sessionStorage = {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    const response = {
      clone() {
        return {
          json() {
            return Promise.resolve({
              code: 0,
              data: {
                items: [],
              },
            });
          },
        };
      },
    };
    const rawFetch = vi.fn(() => Promise.resolve(response));
    const fakeWindow = {
      addEventListener: vi.fn(),
      document,
      fetch: rawFetch,
      location,
      sessionStorage,
      setTimeout: (handler: () => void) => {
        handler();
        return 1;
      },
    };

    vi.stubGlobal("document", document);
    vi.stubGlobal("location", location);
    vi.stubGlobal("setInterval", vi.fn());
    vi.stubGlobal("window", fakeWindow);

    Function(injectCode.default)();

    await fakeWindow.fetch("/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1625060795");
    await Promise.resolve();
    await Promise.resolve();

    expect(rawFetch).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("asks React Native WebView to reload when available", async () => {
    const reload = vi.fn();
    const postMessage = vi.fn();
    const document = {
      body: {
        addEventListener: vi.fn(),
        appendChild: vi.fn(),
      },
      createElement(tagName: string) {
        return {
          addEventListener: vi.fn(),
          className: "",
          id: "",
          innerHTML: "",
          setAttribute: vi.fn(),
          style: {},
          tagName,
          textContent: "",
        };
      },
      getElementById: vi.fn(() => null),
      head: {
        appendChild: vi.fn(),
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
    };
    const location = {
      pathname: "/space/1625060795",
      reload,
    };
    const response = {
      clone() {
        return {
          json() {
            return Promise.resolve({
              code: 0,
              data: {
                items: [],
              },
            });
          },
        };
      },
    };
    const rawFetch = vi.fn(() => Promise.resolve(response));
    const fakeWindow = {
      ReactNativeWebView: {
        postMessage,
      },
      addEventListener: vi.fn(),
      document,
      fetch: rawFetch,
      location,
      sessionStorage: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      setTimeout: (handler: () => void) => {
        handler();
        return 1;
      },
    };

    vi.stubGlobal("document", document);
    vi.stubGlobal("location", location);
    vi.stubGlobal("setInterval", vi.fn());
    vi.stubGlobal("window", fakeWindow);

    Function(injectCode.default)();

    await fakeWindow.fetch("/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1625060795");
    await Promise.resolve();
    await Promise.resolve();

    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ action: "reload-dynamic-page" }));
    expect(reload).not.toHaveBeenCalled();
  });

  test("injects a circular refresh button that reloads the page", () => {
    type FakeElement = {
      children: FakeElement[];
      className: string;
      id: string;
      innerHTML: string;
      listeners: Record<string, (event: Event) => void>;
      parentNode?: FakeElement;
      setAttribute: (name: string, value: string) => void;
      addEventListener: (type: string, handler: (event: Event) => void) => void;
      appendChild: (child: FakeElement) => FakeElement;
      dispatchEvent: (event: Event) => void;
      style: Record<string, string>;
      tagName: string;
      textContent: string;
    };

    const elementsById = new Map<string, FakeElement>();

    function createFakeElement(tagName: string): FakeElement {
      const element: FakeElement = {
        children: [],
        className: "",
        id: "",
        innerHTML: "",
        listeners: {},
        setAttribute(name, value) {
          if (name === "id") {
            this.id = value;
          }
        },
        addEventListener(type, handler) {
          this.listeners[type] = handler;
        },
        appendChild(child) {
          child.parentNode = this;
          this.children.push(child);
          if (child.id) {
            elementsById.set(child.id, child);
          }
          return child;
        },
        dispatchEvent(event) {
          this.listeners[event.type]?.(event);
        },
        style: {},
        tagName,
        textContent: "",
      };

      return element;
    }

    const head = createFakeElement("head");
    const body = createFakeElement("body");
    const dynamicList = createFakeElement("div");
    const reload = vi.fn();
    const document = {
      body,
      createElement: createFakeElement,
      getElementById(id: string) {
        return elementsById.get(id) ?? null;
      },
      head,
      querySelector(selector: string) {
        if (selector === ".no-more") {
          return createFakeElement("div");
        }
        if (selector === ".m-space .list") {
          return dynamicList;
        }
        return null;
      },
    };
    const location = {
      pathname: "/space/1625060795",
      reload,
    };
    const window = {
      addEventListener: vi.fn(),
      document,
      location,
    };

    vi.stubGlobal("document", document);
    vi.stubGlobal("location", location);
    vi.stubGlobal("setInterval", vi.fn());
    vi.stubGlobal("window", window);

    Function(injectCode.default)();

    const button = document.getElementById("minibili-dynamic-refresh-button");
    expect(button?.tagName).toBe("button");
    expect(button?.className).toBe("minibili-dynamic-refresh-button");
    expect(button?.innerHTML).toContain("viewBox");

    button?.dispatchEvent(new Event("click"));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
