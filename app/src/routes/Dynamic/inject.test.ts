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
  test("detects the Bilibili space dynamic feed api", () => {
    expect(
      injectCode.isSpaceDynamicFeedUrl(
        "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=1625060795",
      ),
    ).toBe(true);
    expect(injectCode.isSpaceDynamicFeedUrl("https://api.bilibili.com/x/space/upstat")).toBe(
      false,
    );
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
