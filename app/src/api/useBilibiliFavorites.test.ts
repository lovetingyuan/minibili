import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  FavoriteAccount,
  FavoriteResources,
  FavoriteResourcesKey,
  FavoriteResourcesKeyLoader,
} from "./favorites.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "1", generation: 1 } as FavoriteAccount | null,
  current: true,
  pending: { current: false },
  refs: [] as { current: unknown }[],
  refIndex: 0,
  effects: [] as (() => void)[],
  infinite: vi.fn(),
  swr: vi.fn(),
  request: vi.fn(),
  mutateCache: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
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
  // 分页 hook 用 useRef(false) 作为进行中标记，其余 ref 按调用顺序独立保存
  useRef: (initial: unknown) => {
    if (initial === false) {
      return mocks.pending;
    }
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  },
  useEffect: (effect: () => void) => {
    mocks.effects.push(effect);
  },
}));
vi.mock("swr", () => ({
  default: mocks.swr,
  useSWRConfig: () => ({ mutate: mocks.mutateCache }),
}));
vi.mock("swr/infinite", () => ({ default: mocks.infinite }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: vi.fn() }));
vi.mock("./favorites", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./favorites")>()),
  createBilibiliFavoriteFolder: mocks.createFolder,
  deleteBilibiliFavoriteFolder: mocks.deleteFolder,
}));

import {
  useBilibiliFavoriteFolderActions,
  useBilibiliFavoriteFolders,
  useBilibiliFavoriteResources,
} from "./useBilibiliFavorites";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { FavoriteFolderResultUnknownError, getFavoriteFoldersKey } from "./favorites";
import {
  FavoriteResourcesChangedError,
  invalidateFavoriteResourceRequests,
} from "../features/bilibili-favorites/resource-revisions";

const page: FavoriteResources = {
  info: { id: 123, fid: 1, mid: 1, title: "默认收藏夹", media_count: 41 },
  medias: [{ id: 10, type: 2, title: "video", bvid: "BV1" }],
  has_more: true,
};
const account = { mid: "1", generation: 1 };
const createdFolder = { id: 456, fid: 45, mid: 1, title: "test", media_count: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = account;
  mocks.current = true;
  mocks.pending.current = false;
  mocks.refs = [];
  mocks.refIndex = 0;
  mocks.effects = [];
  mocks.mutateCache.mockResolvedValue(undefined);
  mocks.createFolder.mockResolvedValue(createdFolder);
  mocks.deleteFolder.mockResolvedValue(undefined);
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
  mocks.request.mockResolvedValue(page);
});

describe("favorite hooks", () => {
  test("rejects a pre-mutation page response even when it finishes after the refreshed page", async () => {
    const oldRequest = Promise.withResolvers<FavoriteResources>();
    mocks.request.mockReturnValueOnce(oldRequest.promise);
    useBilibiliFavoriteResources(123);
    const fetchPage: (key: FavoriteResourcesKey) => Promise<FavoriteResources> =
      mocks.infinite.mock.calls[0][1];
    const oldResult = fetchPage(["bilibili-favorite-resources", "1", 1, 123, 1]);
    const rejected = expect(oldResult).rejects.toBeInstanceOf(FavoriteResourcesChangedError);

    invalidateFavoriteResourceRequests(mocks.mutateCache, { mid: "1", generation: 1 }, [123]);
    const freshPage = { ...page, medias: [] };
    mocks.request.mockResolvedValueOnce(freshPage);
    expect(await fetchPage(["bilibili-favorite-resources", "1", 1, 123, 1])).toEqual(freshPage);
    oldRequest.resolve(page);
    await rejected;
    expect(
      mocks.infinite.mock.calls[0][2].shouldRetryOnError(new FavoriteResourcesChangedError()),
    ).toBe(false);
  });

  test("does not discard reads for another folder, account, login generation or cache provider", async () => {
    const request = Promise.withResolvers<FavoriteResources>();
    mocks.request.mockReturnValueOnce(request.promise);
    useBilibiliFavoriteResources(123);
    const fetchPage: (key: FavoriteResourcesKey) => Promise<FavoriteResources> =
      mocks.infinite.mock.calls[0][1];
    const result = fetchPage(["bilibili-favorite-resources", "1", 1, 123, 1]);
    invalidateFavoriteResourceRequests(mocks.mutateCache, { mid: "1", generation: 1 }, [456]);
    invalidateFavoriteResourceRequests(mocks.mutateCache, { mid: "2", generation: 1 }, [123]);
    invalidateFavoriteResourceRequests(mocks.mutateCache, { mid: "1", generation: 2 }, [123]);
    invalidateFavoriteResourceRequests(vi.fn(), { mid: "1", generation: 1 }, [123]);
    request.resolve(page);
    await expect(result).resolves.toEqual(page);
  });

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
      if (state === "loading") {
        mocks.response.isLoading = true;
      }
      if (state === "validating") {
        mocks.response.isValidating = true;
      }
      if (state === "error") {
        mocks.response.error = new Error("page failed");
      }
      if (state === "end") {
        mocks.response.data = [{ ...page, has_more: false }];
      }
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

describe("favorite folder actions", () => {
  const dependencies = expect.anything();

  test("creates a folder with the current account and refreshes the folder list", async () => {
    const actions = useBilibiliFavoriteFolderActions();
    await expect(actions.createFolder({ title: "test", privacy: 0 })).resolves.toEqual(
      createdFolder,
    );
    expect(mocks.createFolder).toHaveBeenCalledWith(
      { account, title: "test", privacy: 0 },
      dependencies,
    );
    expect(mocks.mutateCache).toHaveBeenCalledWith(getFavoriteFoldersKey(account));
  });

  test("deletes a folder, drops its page cache and refreshes the folder list", async () => {
    const actions = useBilibiliFavoriteFolderActions();
    await actions.deleteFolder(123);
    expect(mocks.deleteFolder).toHaveBeenCalledWith({ account, folderId: 123 }, dependencies);
    expect(mocks.mutateCache).toHaveBeenCalledWith(getFavoriteFoldersKey(account));
    // 通过 key 过滤器清理已删除收藏夹的单页缓存
    expect(mocks.mutateCache.mock.calls.some(([key]) => typeof key === "function")).toBe(true);
  });

  test("stays idle without a current account", async () => {
    mocks.account = null;
    const actions = useBilibiliFavoriteFolderActions();
    await expect(actions.createFolder({ title: "test", privacy: 0 })).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    mocks.account = account;
    mocks.current = false;
    await expect(actions.deleteFolder(123)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(mocks.createFolder).not.toHaveBeenCalled();
    expect(mocks.deleteFolder).not.toHaveBeenCalled();
    expect(mocks.mutateCache).not.toHaveBeenCalled();
  });

  test.each(["create", "delete"] as const)(
    "refreshes the list before reporting an unknown %s result",
    async (action) => {
      const failed = new FavoriteFolderResultUnknownError("无法确认结果");
      const target = action === "create" ? mocks.createFolder : mocks.deleteFolder;
      target.mockRejectedValueOnce(failed);
      const actions = useBilibiliFavoriteFolderActions();
      const run =
        action === "create"
          ? actions.createFolder({ title: "test", privacy: 1 })
          : actions.deleteFolder(123);
      await expect(run).rejects.toThrow("无法确认结果，已刷新收藏夹列表");
      expect(mocks.mutateCache).toHaveBeenCalledWith(getFavoriteFoldersKey(account));
    },
  );

  test("blocks a repeated delete of the same folder while it is pending", async () => {
    const pending = Promise.withResolvers<void>();
    mocks.deleteFolder.mockReturnValueOnce(pending.promise);
    const actions = useBilibiliFavoriteFolderActions();
    const first = actions.deleteFolder(123);
    await expect(actions.deleteFolder(123)).rejects.toThrow("操作正在进行，请稍候");
    pending.resolve();
    await first;
    expect(mocks.deleteFolder).toHaveBeenCalledOnce();
  });
});
