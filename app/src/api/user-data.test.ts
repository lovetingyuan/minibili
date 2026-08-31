import { afterEach, expect, test, vi } from "vitest";
import type { UserDataRequestDependencies } from "./user-data.types";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { UserDataUnauthorizedError } from "../features/user-data/errors";

vi.mock("../constants", () => ({ serverUrl: "https://minibili.test" }));
import { requestUserData } from "./user-data";

const account = { mid: "123", generation: 1 };
const cookie = "SESSDATA=session%2F==; DedeUserID=123; bili_jct=csrf";
function setup() {
  const dependencies: UserDataRequestDependencies = {
    readCookie: vi.fn(async () => cookie),
    isCurrentAccount: vi.fn(() => true),
    request: vi.fn(async () =>
      Response.json({ success: true, uid: "123", result: { test: [true] } }),
    ),
  };
  const controller = new AbortController();
  return {
    dependencies,
    controller,
    request: () => requestUserData(account, { get: ["test"] }, controller.signal, dependencies),
  };
}
afterEach(() => vi.useRealTimers());

test("sends credentials only to the fixed Worker endpoint with redirects and native cookies disabled", async () => {
  const { dependencies, request } = setup();
  expect(await request()).toEqual({ success: true, uid: "123", result: { test: [true] } });
  expect(dependencies.request).toHaveBeenCalledWith(
    "https://minibili.test/api/user-data/sync",
    expect.objectContaining({
      headers: { "Content-Type": "application/json", "X-Bilibili-Cookie": cookie },
      body: JSON.stringify({ get: ["test"] }),
      method: "POST",
      credentials: "omit",
      redirect: "error",
    }),
  );
});

test.each([null, "", "buvid3=anonymous", "DedeUserID=123"])(
  "never uses guest cookies as authentication: %s",
  async (value) => {
    const { dependencies, request } = setup();
    vi.mocked(dependencies.readCookie).mockResolvedValue(value);
    await expect(request()).rejects.toBeInstanceOf(UserDataUnauthorizedError);
    expect(dependencies.request).not.toHaveBeenCalled();
  },
);

test("account changes while reading secure storage prevent dispatch", async () => {
  const { dependencies, request } = setup();
  vi.mocked(dependencies.readCookie).mockImplementation(async () => {
    vi.mocked(dependencies.isCurrentAccount).mockReturnValue(false);
    return cookie;
  });
  await expect(request()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  expect(dependencies.request).not.toHaveBeenCalled();
});

test("cookie UID mismatch prevents dispatch", async () => {
  const { dependencies, request } = setup();
  vi.mocked(dependencies.readCookie).mockResolvedValue("SESSDATA=session; DedeUserID=456");
  await expect(request()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  expect(dependencies.request).not.toHaveBeenCalled();
});

test("expired login is distinguished from a temporary backend failure", async () => {
  const { dependencies, request } = setup();
  vi.mocked(dependencies.request).mockResolvedValueOnce(new Response(null, { status: 401 }));
  await expect(request()).rejects.toBeInstanceOf(UserDataUnauthorizedError);
  vi.mocked(dependencies.request).mockResolvedValueOnce(new Response(null, { status: 503 }));
  await expect(request()).rejects.not.toBeInstanceOf(UserDataUnauthorizedError);
});

test("response UID mismatch cannot hydrate another account's data", async () => {
  const { dependencies, request } = setup();
  vi.mocked(dependencies.request).mockResolvedValue(
    Response.json({ success: true, uid: "456", result: {} }),
  );
  await expect(request()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
});

test("late responses after logout are discarded", async () => {
  const { dependencies, controller, request } = setup();
  vi.mocked(dependencies.request).mockImplementation(async () => {
    controller.abort();
    return Response.json({ success: true, uid: "123", result: {} });
  });
  await expect(request()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
});

test("timeout aborts the request and reports that local edits are retained", async () => {
  vi.useFakeTimers();
  const { dependencies, request } = setup();
  vi.mocked(dependencies.request).mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new Error("timeout")));
      }),
  );
  const assertion = expect(request()).rejects.toThrow("设置同步超时，本地修改已保留");
  await vi.advanceTimersByTimeAsync(30001);
  await assertion;
});
