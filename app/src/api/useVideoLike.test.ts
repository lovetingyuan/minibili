import { beforeEach, describe, expect, test, vi } from "vitest";

import type { VideoRelation } from "./video-favorites.types";

const mocks = vi.hoisted(() => ({
  current: true,
  relation: {
    data: { favorite: true, like: false } as VideoRelation | undefined,
    error: undefined as Error | undefined,
    isLoading: false,
  },
  mutation: vi.fn(),
  mutate: vi.fn(),
  trigger: vi.fn(),
  request: vi.fn(),
}));
vi.mock("react", () => ({
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: mocks.mutate }) }));
vi.mock("swr/mutation", () => ({ default: mocks.mutation }));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: vi.fn() }));
vi.mock("./useVideoFavorites", () => ({ useVideoRelation: () => mocks.relation }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));

import { useVideoLike } from "./useVideoLike";
import { VideoLikeResultUnknownError } from "./video-like";
import { getVideoRelationKey } from "./video-favorites";
import { videoRelationMutations } from "../features/bilibili-favorites/video-relation-mutations";

const account = { mid: "123", generation: 1 };
const video = { aid: "456", bvid: "BV1" };
const key = getVideoRelationKey(account, video);
const viewKey = "/x/web-interface/view?bvid=BV1";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.current = true;
  mocks.relation = { data: { favorite: true, like: false }, error: undefined, isLoading: false };
  mocks.mutation.mockReturnValue({ trigger: mocks.trigger });
  mocks.trigger.mockResolvedValue({ video, liked: true });
  mocks.request.mockResolvedValue({ favorite: true, like: true });
  mocks.mutate.mockImplementation(async (cacheKey, updater) => {
    if (typeof updater !== "function") {
      return undefined;
    }
    return updater(Array.isArray(cacheKey) ? mocks.relation.data : { stat: { like: 10 } });
  });
});

describe("video like interaction", () => {
  test.each([false, true])(
    "toggles like=%s and preserves favorite state in the shared cache",
    async (liked) => {
      mocks.relation.data = { favorite: true, like: liked };
      const hook = useVideoLike(account, video);
      expect(hook.liked).toBe(liked);
      expect(await hook.toggle()).toBe(!liked);
      expect(mocks.trigger).toHaveBeenCalledExactlyOnceWith({ video, liked: !liked });
      const [, , options] = mocks.mutation.mock.calls[0];
      expect(options.populateCache({ liked: !liked }, { favorite: true, like: liked })).toEqual({
        favorite: true,
        like: !liked,
      });
      const countCall = mocks.mutate.mock.calls.find(
        ([cacheKey, updater]) => cacheKey === viewKey && typeof updater === "function",
      );
      expect(countCall?.[1]({ stat: { like: 10 } })).toEqual({ stat: { like: liked ? 9 : 11 } });
      expect(mocks.mutate).toHaveBeenCalledWith(key);
    },
  );

  test("rejects repeat presses and shares the lock with favorites", async () => {
    const pending = Promise.withResolvers<void>();
    mocks.trigger.mockReturnValueOnce(pending.promise);
    const hook = useVideoLike(account, video);
    const first = hook.toggle();
    await expect(hook.toggle()).rejects.toThrow("正在进行");
    await expect(videoRelationMutations.run(account, video.aid, async () => {})).rejects.toThrow(
      "正在进行",
    );
    expect(mocks.trigger).toHaveBeenCalledOnce();
    pending.resolve();
    await first;
    expect(videoRelationMutations.getSnapshot().size).toBe(0);
  });

  test("refreshes missing state without posting and waits for another explicit click", async () => {
    mocks.relation.data = { favorite: true };
    expect(await useVideoLike(account, video).toggle()).toBeNull();
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(mocks.trigger).not.toHaveBeenCalled();
  });

  test("does not post when refreshing unknown state fails", async () => {
    mocks.relation.data = undefined;
    mocks.request.mockRejectedValueOnce(new Error("offline"));
    await expect(useVideoLike(account, video).toggle()).rejects.toThrow("offline");
    expect(mocks.trigger).not.toHaveBeenCalled();
  });

  test("preserves cached state and count on business failure", async () => {
    mocks.trigger.mockRejectedValueOnce(new Error("rejected"));
    await expect(useVideoLike(account, video).toggle()).rejects.toThrow("rejected");
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  test("invalidates uncertain state and reconciles without repeating the POST", async () => {
    mocks.trigger.mockRejectedValueOnce(new VideoLikeResultUnknownError("超时"));
    await expect(useVideoLike(account, video).toggle()).rejects.toThrow("超时");
    expect(mocks.trigger).toHaveBeenCalledOnce();
    expect(mocks.request).toHaveBeenCalledOnce();
    const clearState = mocks.mutate.mock.calls[0][1];
    expect(clearState({ favorite: true, like: false })).toEqual({
      favorite: true,
      like: undefined,
    });
    expect(mocks.mutate.mock.calls.some(([cacheKey]) => cacheKey === viewKey)).toBe(false);
  });

  test("does not turn a successful POST into failure if count refresh fails", async () => {
    mocks.mutate.mockRejectedValue(new Error("refresh offline"));
    await expect(useVideoLike(account, video).toggle()).resolves.toBe(true);
  });

  test("does not submit without an account or for an obsolete session", async () => {
    await expect(useVideoLike(null, video).toggle()).rejects.toThrow("登录");
    mocks.current = false;
    await expect(useVideoLike(account, video).toggle()).rejects.toThrow("登录状态已改变");
    expect(mocks.trigger).not.toHaveBeenCalled();
  });
});
