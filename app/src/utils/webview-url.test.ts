import { describe, expect, test } from "vitest";

import { isBilibiliHost, isHttpUrl, shouldAllowWebViewRequest } from "./webview-url";

describe("isBilibiliHost", () => {
  test.each([
    "https://www.bilibili.com/video/BV1",
    "https://b23.tv/abc",
    "https://api.bilibili.com/x/web-interface/view",
    "https://i0.hdslb.com/bfs/archive/cover.jpg",
    "https://upos-sz-mirrorcos.bilivideo.com/xxx.mp4",
  ])("accepts %s", (url) => {
    expect(isBilibiliHost(url)).toBe(true);
  });

  test.each([
    "https://evil.com/bilibili.com",
    "https://bilibili.com.evil.com/",
    "https://fakebilibili.com/",
    "http://localhost:8081",
  ])("rejects %s", (url) => {
    expect(isBilibiliHost(url)).toBe(false);
  });
});

describe("isHttpUrl", () => {
  test("only accepts http(s)", () => {
    expect(isHttpUrl("https://a.com")).toBe(true);
    expect(isHttpUrl("http://a.com")).toBe(true);
    expect(isHttpUrl("bilibili://video/1")).toBe(false);
    expect(isHttpUrl("about:blank")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
  });
});

describe("shouldAllowWebViewRequest", () => {
  test("allows bilibili top-frame navigation", () => {
    expect(
      shouldAllowWebViewRequest({ url: "https://live.bilibili.com/1", isTopFrame: true }),
    ).toBe(true);
  });

  test("blocks external top-frame navigation", () => {
    expect(
      shouldAllowWebViewRequest({ url: "https://evil.example/phish", isTopFrame: true }),
    ).toBe(false);
  });

  test("keeps subframe resources working on third-party hosts", () => {
    expect(
      shouldAllowWebViewRequest({ url: "https://s1.hdslb.com/res.png", isTopFrame: false }),
    ).toBe(true);
    expect(
      shouldAllowWebViewRequest({ url: "https://ad.example/banner.js", isTopFrame: false }),
    ).toBe(true);
  });

  test("blocks custom schemes that are not http(s)", () => {
    expect(shouldAllowWebViewRequest({ url: "bilibili://video/1", isTopFrame: true })).toBe(false);
  });
});
