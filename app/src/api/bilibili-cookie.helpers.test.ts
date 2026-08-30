import { describe, expect, test, vi } from "vitest";

import {
  createBilibiliRequestHeaders,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
  isBilibiliUrl,
  resolveBilibiliCookie,
} from "./bilibili-cookie.helpers";

describe("Bilibili cookie helpers", () => {
  test("recognizes Bilibili domains without accepting lookalikes", () => {
    expect(isBilibiliUrl("https://bilibili.com/path")).toBe(true);
    expect(isBilibiliUrl("https://api.live.bilibili.com/path")).toBe(true);
    expect(isBilibiliUrl("https://bilibili.com.example.com/path")).toBe(false);
    expect(isBilibiliUrl("https://minibili.tingyuan.in/path")).toBe(false);
    expect(isBilibiliUrl("not-a-url")).toBe(false);
  });

  test("requires both session and user cookies", () => {
    expect(hasBilibiliLoginCookie("SESSDATA=session; DedeUserID=123; bili_jct=csrf")).toBe(true);
    expect(hasBilibiliLoginCookie("SESSDATA=session; bili_jct=csrf")).toBe(false);
    expect(hasBilibiliLoginCookie("DedeUserID=123")).toBe(false);
    expect(hasBilibiliLoginCookie("SESSDATA=; DedeUserID=123")).toBe(false);
  });

  test("reads a numeric Bilibili user id from the cookie", () => {
    expect(getBilibiliUserId("SESSDATA=session; DedeUserID=393120021; bili_jct=csrf")).toBe(
      "393120021",
    );
    expect(getBilibiliUserId("DedeUserID=")).toBeNull();
    expect(getBilibiliUserId("DedeUserID=user-1")).toBeNull();
    expect(getBilibiliUserId("SESSDATA=session")).toBeNull();
  });

  test("adds the cookie only for Bilibili and preserves existing headers", () => {
    const bilibiliHeaders = createBilibiliRequestHeaders(
      "https://api.bilibili.com/x/web-interface/nav",
      { accept: "application/json", cookie: "old=value" },
      "SESSDATA=session; DedeUserID=123",
    );
    const externalHeaders = createBilibiliRequestHeaders(
      "https://minibili.tingyuan.in/api/auth/status",
      { accept: "application/json" },
      "SESSDATA=session; DedeUserID=123",
    );

    expect(bilibiliHeaders.get("accept")).toBe("application/json");
    expect(bilibiliHeaders.get("cookie")).toBe("SESSDATA=session; DedeUserID=123");
    expect(externalHeaders.get("accept")).toBe("application/json");
    expect(externalHeaders.has("cookie")).toBe(false);
  });

  test("prefers stored login state and falls back to an anonymous cookie", async () => {
    const createAnonymousCookie = vi.fn(async () => "buvid3=anonymous");

    await expect(resolveBilibiliCookie("SESSDATA=session", createAnonymousCookie)).resolves.toBe(
      "SESSDATA=session",
    );
    expect(createAnonymousCookie).not.toHaveBeenCalled();

    await expect(resolveBilibiliCookie(null, createAnonymousCookie)).resolves.toBe(
      "buvid3=anonymous",
    );
    expect(createAnonymousCookie).toHaveBeenCalledOnce();
  });
});
