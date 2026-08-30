import { beforeEach, describe, expect, test, vi } from "vitest";
import type { SWRInfiniteResponse } from "swr/infinite";
import type { HistoryAccount, HistoryKeyLoader, HistoryPage } from "./history.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "1", generation: 1 } as HistoryAccount | null,
  current: true,
  refs: [] as { current: unknown }[],
  refIndex: 0,
  refreshing: false,
  infinite: vi.fn(),
  request: vi.fn(),
  response: {
    data: undefined as HistoryPage[] | undefined,
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined as Error | undefined,
    setSize:
      vi.fn<(value: number | ((size: number) => number)) => Promise<HistoryPage[] | undefined>>(),
    mutate: vi.fn<SWRInfiniteResponse<HistoryPage>["mutate"]>(),
  },
}));
vi.mock("react", () => ({
  useRef: (initial: unknown) => {
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  },
  useState: () => [
    mocks.refreshing,
    (value: boolean) => {
      mocks.refreshing = value;
    },
  ],
}));
vi.mock("swr/infinite", () => ({ default: mocks.infinite }));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));

import { useBilibiliHistory } from "./useBilibiliHistory";

const first: HistoryPage = {
  cursor: { max: 20, view_at: 1000, business: "archive" },
  hasMore: true,
  chainId: 1,
  list: [{ title: "video", view_at: 1000, history: { business: "archive", oid: 20, bvid: "BV1" } }],
};
const second: HistoryPage = {
  ...first,
  cursor: { ...first.cursor, max: 10, view_at: 900 },
  list: [{ title: "older", view_at: 900, history: { business: "archive", oid: 10, bvid: "BV2" } }],
};
function render() {
  mocks.refIndex = 0;
  return useBilibiliHistory();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.account = { mid: "1", generation: 1 };
  mocks.current = true;
  mocks.refs = [];
  mocks.refreshing = false;
  Object.assign(mocks.response, {
    data: [first],
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined,
  });
  mocks.infinite.mockReturnValue(mocks.response);
  mocks.response.setSize.mockResolvedValue([first]);
  mocks.response.mutate.mockResolvedValue([first]);
});

describe("history hook", () => {
  test("hides cached records and stops requests after logout or session invalidation", async () => {
    mocks.current = false;
    const hook = render();
    const getKey: HistoryKeyLoader = mocks.infinite.mock.calls[0][0];
    expect(getKey(0, null)).toBeNull();
    expect(hook.items).toEqual([]);
    await hook.loadMore();
    await hook.refresh();
    await hook.retry();
    expect(mocks.response.setSize).not.toHaveBeenCalled();
    expect(mocks.response.mutate).not.toHaveBeenCalled();
    mocks.current = true;
    mocks.account = null;
    expect(render().items).toEqual([]);
  });

  test("allows only one pending append across repeated events and renders", async () => {
    const deferred = Promise.withResolvers<HistoryPage[] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(deferred.promise);
    const hook = render();
    const loading = hook.loadMore();
    await hook.loadMore();
    await render().loadMore();
    expect(mocks.response.setSize).toHaveBeenCalledOnce();
    const update = mocks.response.setSize.mock.calls[0][0];
    expect(typeof update === "function" ? update(1) : update).toBe(2);
    deferred.resolve([first, second]);
    await loading;
    await render().loadMore();
    expect(mocks.response.setSize).toHaveBeenCalledTimes(2);
  });

  test.each(["loading", "validating", "error", "end"])(
    "does not append while %s",
    async (state) => {
      if (state === "loading") mocks.response.isLoading = true;
      if (state === "validating") mocks.response.isValidating = true;
      if (state === "error") mocks.response.error = new Error("offline");
      if (state === "end") mocks.response.data = [{ ...first, hasMore: false }];
      await render().loadMore();
      expect(mocks.response.setSize).not.toHaveBeenCalled();
    },
  );

  test("retains existing items after append failure and retries only missing pages", async () => {
    mocks.response.setSize.mockRejectedValueOnce(new Error("offline"));
    await expect(render().loadMore()).rejects.toThrow("offline");
    mocks.response.size = 2;
    mocks.response.error = new Error("offline");
    const failed = render();
    expect(failed.items).toHaveLength(1);
    expect(failed.isLoadingMore).toBe(false);
    await failed.retry();
    const options = mocks.response.mutate.mock.calls[0][1];
    expect(options).toBeDefined();
    if (!options || typeof options !== "object" || typeof options.revalidate !== "function")
      throw new Error("Missing predicate");
    expect(options.revalidate(first, "page-1")).toBe(false);
    // SWR 运行时会向此回调传入尚未缓存页面的 undefined。
    expect(Reflect.apply(options.revalidate, undefined, [undefined, "page-2"])).toBe(true);
  });

  test("refresh waits for append, blocks further appends, and resets before revalidation", async () => {
    const deferred = Promise.withResolvers<HistoryPage[] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(deferred.promise);
    const hook = render();
    const loading = hook.loadMore();
    const refreshing = hook.refresh();
    await hook.refresh();
    await render().loadMore();
    expect(render().refreshing).toBe(true);
    expect(mocks.response.setSize).toHaveBeenCalledOnce();
    expect(mocks.response.mutate).not.toHaveBeenCalled();
    deferred.resolve([first, second]);
    await loading;
    await refreshing;
    expect(mocks.response.setSize).toHaveBeenLastCalledWith(1);
    expect(mocks.response.mutate).toHaveBeenCalledOnce();
    expect(mocks.response.setSize.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.response.mutate.mock.invocationCallOrder[0],
    );
    expect(render().refreshing).toBe(false);
  });

  test("refresh can recover from a rejected append and releases its lock on failure", async () => {
    const deferred = Promise.withResolvers<HistoryPage[] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(deferred.promise);
    const hook = render();
    const loading = hook.loadMore();
    const rejection = expect(loading).rejects.toThrow("append failed");
    const refreshing = hook.refresh();
    deferred.reject(new Error("append failed"));
    await rejection;
    await refreshing;
    expect(mocks.response.mutate).toHaveBeenCalledOnce();
    mocks.response.mutate.mockRejectedValueOnce(new Error("refresh failed"));
    await expect(render().refresh()).rejects.toThrow("refresh failed");
    expect(render().refreshing).toBe(false);
    await render().retry();
    expect(mocks.response.setSize).toHaveBeenLastCalledWith(1);
  });

  test("a logout during pending append prevents the queued refresh", async () => {
    const deferred = Promise.withResolvers<HistoryPage[] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(deferred.promise);
    const hook = render();
    const loading = hook.loadMore();
    const refreshing = hook.refresh();
    mocks.current = false;
    deferred.resolve([first, second]);
    await loading;
    await refreshing;
    expect(mocks.response.setSize).toHaveBeenCalledOnce();
    expect(mocks.response.mutate).not.toHaveBeenCalled();
    expect(render().items).toEqual([]);
  });
});
