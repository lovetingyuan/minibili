import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("./get-cookie", () => ({ getCookie: vi.fn(async () => "SESSDATA=saved; DedeUserID=123") }));

import bilibiliFetch from "./bilibili-fetch";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Bilibili request credentials", () => {
  test("uses the saved session without an ambient native cookie overriding it", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", request);
    await bilibiliFetch("https://api.bilibili.com/x/test", { credentials: "include" });
    const options = request.mock.calls[0][1];
    expect(options?.credentials).toBe("omit");
    expect(new Headers(options?.headers).get("cookie")).toBe("SESSDATA=saved; DedeUserID=123");
  });

  test("does not alter or attach Bilibili credentials to other services", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", request);
    const options = { credentials: "include" } satisfies RequestInit;
    await bilibiliFetch("https://minibili.tingyuan.in/api/test", options);
    expect(request).toHaveBeenCalledWith("https://minibili.tingyuan.in/api/test", options);
  });
});
