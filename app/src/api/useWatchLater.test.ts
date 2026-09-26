import { beforeEach, describe, expect, test, vi } from "vitest";

import type { WatchLaterAccount } from "./watch-later.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "123", generation: 2 } as WatchLaterAccount | null,
  current: true,
  key: undefined as unknown,
  fetcher: undefined as unknown,
  request: vi.fn(),
  modify: vi.fn(async () => undefined),
  mutate: vi.fn(async (_key: unknown, _data?: unknown, _options?: unknown) => undefined),
  added: vi.fn(),
  removed: vi.fn(),
  pending: new Set<string>(),
  response: {
    data: undefined as unknown,
    error: undefined as Error | undefined,
    isLoading: false,
    isValidating: false,
  },
  useSWR: vi.fn((key: unknown, fetcherFn: unknown) => {
    mocks.key = key;
    mocks.fetcher = fetcherFn;
    return mocks.response;
  }),
}));

vi.mock("swr", () => ({
  default: mocks.useSWR,
  useSWRConfig: () => ({ mutate: mocks.mutate }),
}));
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return { ...original, useSyncExternalStore: () => mocks.pending };
});
vi.mock("../features/bilibili-favorites/mutations", () => ({
  favoriteMutationKey: (account: WatchLaterAccount, aid: string) =>
    `${account.mid}:${account.generation}:${aid}`,
}));
vi.mock("../features/bilibili-watch-later/mutations", () => ({
  watchLaterMutations: {
    subscribe: vi.fn(),
    getSnapshot: () => mocks.pending,
    run: async (_account: WatchLaterAccount, _aid: string, work: () => Promise<unknown>) => work(),
  },
}));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));
vi.mock("../store/watch-later", () => ({
  markWatchLaterAdded: mocks.added,
  markWatchLaterRemoved: mocks.removed,
}));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: async () => "cookie" }));
vi.mock("./watch-later", async (importOriginal) => {
  const original = await importOriginal<typeof import("./watch-later")>();
  return { ...original, modifyWatchLater: mocks.modify };
});

import { WatchLaterResponseSchema } from "./watch-later.schema";
import { WatchLaterResultUnknownError } from "./watch-later";
import { useBilibiliWatchLater, useModifyWatchLater } from "./useWatchLater";

const account: WatchLaterAccount = { mid: "123", generation: 2 };
const payload = WatchLaterResponseSchema.parse({
  count: 1,
  list: [
    {
      aid: 42,
      bvid: "BV1TEST",
      title: "视频",
      pic: "cover.jpg",
      duration: 100,
      progress: 50,
      viewed: false,
      owner: { mid: 7, name: "UP", face: "face.jpg" },
      stat: { view: 10, danmaku: 1 },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { ...account };
  mocks.current = true;
  mocks.pending = new Set<string>();
  mocks.response.data = undefined;
  mocks.response.error = undefined;
  mocks.request.mockResolvedValue(payload);
  mocks.modify.mockResolvedValue(undefined);
});

describe("useBilibiliWatchLater", () => {
  test("does not request the list without a current account", () => {
    mocks.account = null;
    const result = useBilibiliWatchLater();
    expect(mocks.key).toBeNull();
    expect(result.items).toEqual([]);
  });

  test("keys the list by account generation and maps the items", () => {
    mocks.response.data = payload;
    const result = useBilibiliWatchLater();
    expect(mocks.key).toEqual(["bilibili-watch-later", "123", 2]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ aid: "42", progressRatio: 0.5 });
  });

  test("loads the list through the shared fetch helper", async () => {
    mocks.response.data = payload;
    useBilibiliWatchLater();
    const load = mocks.fetcher as (key: unknown) => Promise<unknown>;
    await expect(load(["bilibili-watch-later", "123", 2])).resolves.toMatchObject({ count: 1 });
    expect(mocks.request).toHaveBeenCalledExactlyOnceWith(
      "/x/v2/history/toview/web?web_location=333.1007",
    );
  });
});

describe("useModifyWatchLater", () => {
  test("marks an added video without touching the cached list", async () => {
    await useModifyWatchLater().toggle(account, "42", true);
    expect(mocks.modify).toHaveBeenCalledOnce();
    expect(mocks.added).toHaveBeenCalledExactlyOnceWith("42");
    expect(mocks.removed).not.toHaveBeenCalled();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  test("drops a removed video from the cached list", async () => {
    await useModifyWatchLater().toggle(account, "42", false);
    expect(mocks.removed).toHaveBeenCalledExactlyOnceWith("42");
    expect(mocks.added).not.toHaveBeenCalled();
    const [key, updater] = mocks.mutate.mock.calls[0] as unknown as [
      unknown,
      (current: { count: number; list: { aid: number }[] }) => {
        count: number;
        list: { aid: number }[];
      },
    ];
    expect(key).toEqual(["bilibili-watch-later", "123", 2]);
    expect(updater({ count: 2, list: [{ aid: 42 }, { aid: 7 }] })).toEqual({
      count: 1,
      list: [{ aid: 7 }],
    });
  });

  test("refreshes the list when the server result is unknown", async () => {
    mocks.modify.mockRejectedValueOnce(
      new WatchLaterResultUnknownError("无法确认添加稍后再看结果"),
    );
    await expect(useModifyWatchLater().toggle(account, "42", true)).rejects.toBeInstanceOf(
      WatchLaterResultUnknownError,
    );
    expect(mocks.mutate).toHaveBeenCalledOnce();
    expect(mocks.added).not.toHaveBeenCalled();
  });

  test("exposes the per video pending flag", () => {
    mocks.pending = new Set(["123:2:42"]);
    expect(useModifyWatchLater().isPending("42")).toBe(true);
    expect(useModifyWatchLater().isPending("7")).toBe(false);
  });
});
