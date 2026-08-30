import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  FavoriteAccount,
  FavoriteResources,
  FavoriteResourcesKeyLoader,
} from "./favorites.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "1", generation: 1 } as FavoriteAccount | null,
  current: true,
  pending: { current: false },
  effects: [] as (() => void)[],
  infinite: vi.fn(),
  swr: vi.fn(),
  request: vi.fn(),
  response: {
    data: undefined as FavoriteResources[] | undefined,
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined as Error | undefined,
    setSize:
      vi.fn<
        (value: number | ((size: number) => number)) => Promise<FavoriteResources[] | undefined>
      >(),
    mutate: vi.fn<() => Promise<FavoriteResources[] | undefined>>(),
  },
}));

vi.mock("react", () => ({
  useRef: () => mocks.pending,
  useEffect: (effect: () => void) => {
    mocks.effects.push(effect);
  },
}));
vi.mock("swr", () => ({ default: mocks.swr }));
vi.mock("swr/infinite", () => ({ default: mocks.infinite }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));
vi.mock("./fetcher", () => ({ default: mocks.request }));

import { useBilibiliFavoriteFolders, useBilibiliFavoriteResources } from "./useBilibiliFavorites";

const page: FavoriteResources = {
  info: { id: 123, fid: 1, mid: 1, title: "默认收藏夹", media_count: 41 },
  medias: [{ id: 10, type: 2, title: "video", bvid: "BV1" }],
  has_more: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { mid: "1", generation: 1 };
  mocks.current = true;
  mocks.pending.current = false;
  mocks.effects = [];
  Object.assign(mocks.response, {
    data: [page],
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined,
  });
  mocks.response.setSize.mockResolvedValue([page]);
  mocks.response.mutate.mockResolvedValue([page]);
  mocks.infinite.mockReturnValue(mocks.response);
  mocks.swr.mockReturnValue({ data: { count: 1, list: [page.info] } });
});

describe("favorite hooks", () => {
  test("disables fetching and hides cached contents when the session is no longer current", () => {
    mocks.current = false;
    expect(useBilibiliFavoriteFolders().data).toBeUndefined();
    expect(mocks.swr.mock.calls[0][0]).toBeNull();
    const result = useBilibiliFavoriteResources(123);
    const getKey: FavoriteResourcesKeyLoader = mocks.infinite.mock.calls[0][0];
    expect(getKey(0, null)).toBeNull();
    expect(result.items).toEqual([]);
  });

  test("allows only one pending next-page request even for repeated onEndReached events", async () => {
    const pending = Promise.withResolvers<FavoriteResources[] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(pending.promise);
    const hook = useBilibiliFavoriteResources(123);
    const first = hook.loadMore();
    await hook.loadMore();
    expect(mocks.response.setSize).toHaveBeenCalledOnce();
    const nextSize = mocks.response.setSize.mock.calls[0][0];
    expect(typeof nextSize === "function" ? nextSize(1) : nextSize).toBe(2);
    pending.resolve([page]);
    await first;
    expect(mocks.pending.current).toBe(false);
  });

  test.each(["loading", "validating", "error", "end"])(
    "does not queue more pages while %s",
    async (state) => {
      if (state === "loading") mocks.response.isLoading = true;
      if (state === "validating") mocks.response.isValidating = true;
      if (state === "error") mocks.response.error = new Error("page failed");
      if (state === "end") mocks.response.data = [{ ...page, has_more: false }];
      await useBilibiliFavoriteResources(123).loadMore();
      expect(mocks.response.setSize).not.toHaveBeenCalled();
    },
  );

  test("keeps loaded items on a failed later page and releases the request lock", async () => {
    mocks.response.setSize.mockRejectedValueOnce(new Error("offline"));
    const hook = useBilibiliFavoriteResources(123);
    await expect(hook.loadMore()).rejects.toThrow("offline");
    expect(mocks.pending.current).toBe(false);
    mocks.response.error = new Error("offline");
    mocks.response.size = 2;
    const failed = useBilibiliFavoriteResources(123);
    expect(failed.items).toHaveLength(1);
    expect(failed.isLoadingMore).toBe(false);
    await failed.mutate();
    expect(mocks.response.mutate).toHaveBeenCalledOnce();
  });

  test("resets the cached page count when switching folders and refreshes from page one", async () => {
    mocks.response.size = 3;
    const hook = useBilibiliFavoriteResources(456);
    mocks.effects.forEach((effect) => effect());
    expect(mocks.response.setSize).toHaveBeenCalledWith(1);
    const getKey: FavoriteResourcesKeyLoader = mocks.infinite.mock.calls[0][0];
    expect(getKey(0, null)).toEqual(["bilibili-favorite-resources", "1", 1, 456, 1]);
    mocks.response.setSize.mockClear();
    await hook.refresh();
    expect(mocks.response.setSize).toHaveBeenCalledWith(1);
    expect(mocks.response.mutate).toHaveBeenCalledOnce();
    expect(mocks.response.setSize.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.response.mutate.mock.invocationCallOrder[0],
    );
  });
});
