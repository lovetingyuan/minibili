import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetcher: vi.fn(),
  isCurrentAccount: vi.fn(),
  useBilibiliSessionState: vi.fn(),
  useSWR: vi.fn(),
}));

vi.mock("swr", () => ({ default: mocks.useSWR }));
vi.mock("./fetcher", () => ({ default: mocks.fetcher }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: mocks.isCurrentAccount },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: mocks.useBilibiliSessionState,
}));

import { fetchLiveUps, useLiveUps } from "./live-ups";

const liveUpsData = {
  count: 2,
  items: [
    {
      link: "https://live.bilibili.com/25334922",
      is_reserve_recall: false,
      mid: "1625060795",
      uname: "浪仔小牛",
      face: "https://i2.hdslb.com/bfs/face/0f5c077c743dd4c1e0a8f3089becc6f4acbddc75.jpg",
    },
    {
      link: "https://live.bilibili.com/22230707",
      is_reserve_recall: false,
      mid: "35847683",
      uname: "峰哥亡命天涯",
      face: "https://i2.hdslb.com/bfs/face/ae439693d6fd79a55b1b5f935ed6474ae6fba35b.jpg",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useSWR.mockReturnValue({});
});

test("fetchLiveUps requests the live-up endpoint and parses items", async () => {
  mocks.fetcher.mockResolvedValueOnce(liveUpsData);

  const result = await fetchLiveUps();

  expect(mocks.fetcher).toHaveBeenCalledWith("/x/polymer/web-dynamic/v1/live-up");
  expect(result).toEqual(liveUpsData);
});

test("fetchLiveUps rejects malformed items", async () => {
  mocks.fetcher.mockResolvedValueOnce({
    count: 1,
    items: [{ is_reserve_recall: false, mid: "1", uname: "UP", face: "" }],
  });

  await expect(fetchLiveUps()).rejects.toThrow();
});

test("useLiveUps polls only for the current logged-in account", () => {
  mocks.useBilibiliSessionState.mockReturnValue({ account: { mid: "123", generation: 3 } });
  mocks.isCurrentAccount.mockReturnValue(true);

  useLiveUps();

  expect(mocks.useSWR).toHaveBeenCalledWith(["bilibili-live-ups", "123", 3], expect.any(Function), {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
});

test("useLiveUps does not request for a stale or missing account", () => {
  mocks.useBilibiliSessionState.mockReturnValue({ account: { mid: "123", generation: 3 } });
  mocks.isCurrentAccount.mockReturnValue(false);

  useLiveUps();

  expect(mocks.useSWR).toHaveBeenCalledWith(null, expect.any(Function), {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
});
