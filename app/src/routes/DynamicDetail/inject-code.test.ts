import { beforeAll, describe, expect, test, vi } from "vitest";

type EmptySpaceDynamicListState = {
  dynamicItemCount: number;
  hasNoMore: boolean;
  pathname: string;
  retryCount: number;
  retryLimit: number;
};

type InjectCodeModule = {
  isDynamicFeedUrl: (url: string) => boolean;
  shouldReloadEmptySpaceDynamicList: (state: EmptySpaceDynamicListState) => boolean;
  shouldRetryDynamicFeedPayload: (
    payload: { code?: number },
    retryCount: number,
    retryLimit: number,
  ) => boolean;
};

let injectCode: InjectCodeModule;

beforeAll(async () => {
  vi.stubGlobal("__DEV__", false);
  injectCode = (await import("./inject-code")) as InjectCodeModule;
});

describe("DynamicDetail injected script helpers", () => {
  test("detects the Bilibili space dynamic feed api", () => {
    expect(
      injectCode.isDynamicFeedUrl(
        "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=1625060795",
      ),
    ).toBe(true);
    expect(injectCode.isDynamicFeedUrl("https://api.bilibili.com/x/space/upstat")).toBe(false);
  });

  test("retries the first dynamic feed request blocked by Gaia risk control", () => {
    expect(injectCode.shouldRetryDynamicFeedPayload({ code: -352 }, 0, 2)).toBe(true);
    expect(injectCode.shouldRetryDynamicFeedPayload({ code: 0 }, 0, 2)).toBe(false);
    expect(injectCode.shouldRetryDynamicFeedPayload({ code: -352 }, 2, 2)).toBe(false);
  });

  test("reloads an empty space dynamic list only while retry budget remains", () => {
    expect(
      injectCode.shouldReloadEmptySpaceDynamicList({
        dynamicItemCount: 0,
        hasNoMore: true,
        pathname: "/space/1625060795",
        retryCount: 0,
        retryLimit: 2,
      }),
    ).toBe(true);
    expect(
      injectCode.shouldReloadEmptySpaceDynamicList({
        dynamicItemCount: 1,
        hasNoMore: true,
        pathname: "/space/1625060795",
        retryCount: 0,
        retryLimit: 2,
      }),
    ).toBe(false);
    expect(
      injectCode.shouldReloadEmptySpaceDynamicList({
        dynamicItemCount: 0,
        hasNoMore: true,
        pathname: "/space/1625060795",
        retryCount: 2,
        retryLimit: 2,
      }),
    ).toBe(false);
  });
});
