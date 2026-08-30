import type { Cookie } from "@preeternal/react-native-cookie-manager";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  BilibiliCookieModuleUnavailableError,
  parseBilibiliWebViewCookies,
  writeBilibiliWebViewCookies,
} from "./webview-cookies";

const native = vi.hoisted(() => ({
  set: vi.fn<(url: string, cookie: Cookie, useWebKit?: boolean) => Promise<boolean>>(),
  load: vi.fn(),
  unavailable: false,
}));

beforeEach(() => {
  vi.resetModules();
  native.set.mockReset().mockResolvedValue(true);
  native.load.mockClear();
  native.unavailable = false;
  vi.stubEnv("EXPO_OS", "android");
  vi.doMock("@preeternal/react-native-cookie-manager", () => {
    native.load();
    if (native.unavailable) {
      throw new Error("Native module missing");
    }
    return { default: { set: native.set } };
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("Bilibili WebView cookies", () => {
  test("preserves encoded values and equals signs with scoped, session-only cookies", () => {
    const cookies = parseBilibiliWebViewCookies(
      " SESSDATA=a%2Fb%3D==; DedeUserID=123; bili_jct=csrf; empty=; ignored; =bad; SESSDATA=new%2F== ",
    );
    expect(cookies).toEqual([
      {
        name: "SESSDATA",
        value: "new%2F==",
        domain: ".bilibili.com",
        path: "/",
        secure: true,
        httpOnly: true,
      },
      {
        name: "DedeUserID",
        value: "123",
        domain: ".bilibili.com",
        path: "/",
        secure: true,
        httpOnly: false,
      },
      {
        name: "bili_jct",
        value: "csrf",
        domain: ".bilibili.com",
        path: "/",
        secure: true,
        httpOnly: false,
      },
      {
        name: "empty",
        value: "",
        domain: ".bilibili.com",
        path: "/",
        secure: true,
        httpOnly: false,
      },
    ]);
  });

  test.each(["android", "ios"])(
    "writes all cookies to the appropriate %s stores",
    async (platform) => {
      vi.stubEnv("EXPO_OS", platform);
      await writeBilibiliWebViewCookies("SESSDATA=session; DedeUserID=123; bili_jct=csrf");
      const cookies = parseBilibiliWebViewCookies(
        "SESSDATA=session; DedeUserID=123; bili_jct=csrf",
      );
      const stores = platform === "ios" ? [false, true] : [false];
      expect(native.set.mock.calls).toEqual(
        cookies.flatMap((cookie) =>
          stores.map((store) => ["https://api.bilibili.com/", cookie, store]),
        ),
      );
    },
  );

  test("does not load the native module when there are no cookies", async () => {
    await writeBilibiliWebViewCookies(" ; ");
    expect(native.load).not.toHaveBeenCalled();
    expect(native.set).not.toHaveBeenCalled();
  });

  test("reports a missing native module with rebuild instructions", async () => {
    native.unavailable = true;
    await expect(writeBilibiliWebViewCookies("SESSDATA=session")).rejects.toBeInstanceOf(
      BilibiliCookieModuleUnavailableError,
    );
    expect(native.set).not.toHaveBeenCalled();
  });

  test("waits for each native write before starting another", async () => {
    let finishWrite!: (success: boolean) => void;
    let writeStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      writeStarted = resolve;
    });
    native.set.mockImplementationOnce(() => {
      writeStarted();
      return new Promise<boolean>((resolve) => {
        finishWrite = resolve;
      });
    });
    const pending = writeBilibiliWebViewCookies("SESSDATA=session; DedeUserID=123");
    await started;
    expect(native.set).toHaveBeenCalledTimes(1);
    finishWrite(true);
    await pending;
    expect(native.set).toHaveBeenCalledTimes(2);
  });

  test("stops on a false result from the WebKit store and can retry", async () => {
    vi.stubEnv("EXPO_OS", "ios");
    native.set.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(writeBilibiliWebViewCookies("SESSDATA=session; DedeUserID=123")).rejects.toThrow(
      "Cookie 同步失败",
    );
    expect(native.set).toHaveBeenCalledTimes(2);
    await expect(
      writeBilibiliWebViewCookies("SESSDATA=session; DedeUserID=123"),
    ).resolves.toBeUndefined();
  });

  test("stops on a rejected native write without starting remaining writes", async () => {
    native.set.mockRejectedValueOnce(new Error("native failure"));
    await expect(writeBilibiliWebViewCookies("SESSDATA=session; DedeUserID=123")).rejects.toThrow(
      "native failure",
    );
    expect(native.set).toHaveBeenCalledTimes(1);
  });
});
