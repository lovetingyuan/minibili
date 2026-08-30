import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  current: true,
  swr: vi.fn(),
  mutation: vi.fn(),
  mutate: vi.fn(),
  trigger: vi.fn(),
}));

vi.mock("react", () => ({
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("swr", async (original) => ({
  ...(await original<typeof import("swr")>()),
  default: mocks.swr,
  useSWRConfig: () => ({ mutate: mocks.mutate }),
}));
vi.mock("swr/mutation", () => ({ default: mocks.mutation }));
vi.mock("./fetcher", () => ({ default: vi.fn() }));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: vi.fn() }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));

import {
  useModifyVideoFavorites,
  useVideoFavoriteFolders,
  useVideoRelation,
} from "./useVideoFavorites";
import { getVideoFavoriteFoldersKey, getVideoRelationKey } from "./video-favorites";

const account = { mid: "123", generation: 1 };
const video = { aid: "456", bvid: "BV1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.current = true;
  mocks.swr.mockReturnValue({ data: { favorite: true } });
  mocks.mutation.mockReturnValue({ trigger: mocks.trigger });
  mocks.trigger.mockResolvedValue({ video, initialIds: [], selectedIds: [11] });
  mocks.mutate.mockResolvedValue(undefined);
});

describe("video favorite hooks", () => {
  test("hides previous relation data and disables querying without a current account/video", () => {
    expect(useVideoRelation(null, video).data).toBeUndefined();
    expect(useVideoRelation(account, null).data).toBeUndefined();
    mocks.current = false;
    expect(useVideoRelation(account, video).data).toBeUndefined();
    expect(mocks.swr.mock.calls.every(([key]) => key === null)).toBe(true);
  });

  test("uses an explicit folder GET trigger that propagates failures instead of returning stale data", () => {
    useVideoFavoriteFolders(account, video);
    const [key, , options] = mocks.mutation.mock.calls[0];
    expect(key).toEqual(getVideoFavoriteFoldersKey(account, video));
    expect(options).toMatchObject({ populateCache: true, revalidate: false, throwOnError: true });
    expect(mocks.trigger).not.toHaveBeenCalled();
    expect(mocks.swr).not.toHaveBeenCalled();
  });

  test("updates relation cache after a successful POST without counting selected folders as favorites", async () => {
    const hook = useModifyVideoFavorites(account, video);
    const [key, , options] = mocks.mutation.mock.calls[0];
    expect(key).toEqual(getVideoRelationKey(account, video));
    expect(options.populateCache({ selectedIds: [11, 22] })).toEqual({ favorite: true });
    expect(options.populateCache({ selectedIds: [] })).toEqual({ favorite: false });
    expect(options.populateCache({ selectedIds: [11] }, { favorite: false, like: true })).toEqual({
      favorite: true,
      like: true,
    });
    await hook.save([11], [11, 22]);
    expect(mocks.trigger).toHaveBeenCalledWith({ video, initialIds: [11], selectedIds: [11, 22] });
  });

  test("cache refresh failure cannot reject an already successful save", async () => {
    mocks.mutate.mockRejectedValue(new Error("refresh offline"));
    await expect(useModifyVideoFavorites(account, video).save([], [11])).resolves.toBeUndefined();
    await vi.waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  });

  test("does not refresh caches after a rejected POST", async () => {
    mocks.trigger.mockRejectedValueOnce(new Error("rejected"));
    await expect(useModifyVideoFavorites(account, video).save([], [11])).rejects.toThrow(
      "rejected",
    );
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
