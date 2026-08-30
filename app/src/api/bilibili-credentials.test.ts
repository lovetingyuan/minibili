import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const storage = vi.hoisted(() => ({
  getStoredBilibiliCookie: vi.fn<() => Promise<string | null>>(),
  setStoredBilibiliCookie: vi.fn<(cookie: string) => Promise<void>>(),
  clearStoredBilibiliCookie: vi.fn<() => Promise<void>>(),
}));
vi.mock("../utils/secure-store", () => storage);

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.resetAllMocks();
  storage.getStoredBilibiliCookie.mockResolvedValue("SESSDATA=old; DedeUserID=1");
  storage.setStoredBilibiliCookie.mockResolvedValue();
  storage.clearStoredBilibiliCookie.mockResolvedValue();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("Bilibili credential cache", () => {
  test("saving and clearing updates the cookie used by API requests", async () => {
    const cookies = await import("./get-cookie");
    await cookies.getBilibiliLoginCookie();
    await cookies.saveBilibiliLoginCookie("SESSDATA=new; DedeUserID=2");
    await expect(cookies.getCookie()).resolves.toBe("SESSDATA=new; DedeUserID=2");
    await cookies.clearBilibiliLoginCookie();
    await expect(cookies.getBilibiliLoginCookie()).resolves.toBeNull();
    expect(storage.clearStoredBilibiliCookie).toHaveBeenCalledOnce();
  });

  test("a delayed storage read cannot resurrect a cookie after logout", async () => {
    let resolve!: (value: string) => void;
    storage.getStoredBilibiliCookie.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const cookies = await import("./get-cookie");
    const pending = cookies.getBilibiliLoginCookie();
    await cookies.clearBilibiliLoginCookie();
    resolve("SESSDATA=old; DedeUserID=1");
    await expect(pending).resolves.toBeNull();
    await expect(cookies.getBilibiliLoginCookie()).resolves.toBeNull();
  });

  test("a delayed storage read cannot overwrite newly saved credentials", async () => {
    let resolve!: (value: string) => void;
    storage.getStoredBilibiliCookie.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const cookies = await import("./get-cookie");
    const pending = cookies.getBilibiliLoginCookie();
    await cookies.saveBilibiliLoginCookie("SESSDATA=new; DedeUserID=2");
    resolve("SESSDATA=old; DedeUserID=1");
    await expect(pending).resolves.toBe("SESSDATA=new; DedeUserID=2");
  });

  test("failed storage reads remain retryable instead of becoming a cached logout", async () => {
    storage.getStoredBilibiliCookie.mockRejectedValueOnce(new Error("locked"));
    const cookies = await import("./get-cookie");
    await expect(cookies.getBilibiliLoginCookie()).rejects.toThrow("locked");
    await expect(cookies.getBilibiliLoginCookie()).resolves.toBe("SESSDATA=old; DedeUserID=1");
  });
});
