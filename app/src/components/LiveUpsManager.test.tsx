import { beforeEach, describe, expect, test, vi } from "vitest";

import type { UpInfo } from "@/types";

const mocks = vi.hoisted(() => ({
  followedUps: [] as UpInfo[],
  data: undefined as unknown,
  ref: { current: undefined as unknown, initialized: false },
  mutate: vi.fn(async () => undefined),
  setLivingUps: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: (initial: unknown) => {
        if (!mocks.ref.initialized) {
          mocks.ref.current = initial;
          mocks.ref.initialized = true;
        }
        return mocks.ref;
      },
      useEffect: (effect: () => void | (() => void)) => effect(),
    },
  };
});
vi.mock("@/api/live-ups", () => ({
  useLiveUps: () => ({ data: mocks.data, mutate: mocks.mutate }),
}));
vi.mock("@/store", () => ({
  useStore: () => ({ $followedUps: mocks.followedUps, setLivingUps: mocks.setLivingUps }),
}));

import LiveUpsManager from "./LiveUpsManager";

function up(mid: number): UpInfo {
  return { mid, name: `UP${mid}`, face: "", sign: "" };
}

function liveItem(mid: number) {
  return {
    link: `https://live.bilibili.com/${mid}`,
    is_reserve_recall: false,
    mid: String(mid),
    uname: `UP${mid}`,
    face: "",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.followedUps = [];
  mocks.data = undefined;
  mocks.ref.current = undefined;
  mocks.ref.initialized = false;
});

describe("live ups followings sync", () => {
  test("re-fetches live ups after the followed list changed", () => {
    mocks.followedUps = [up(1)];
    LiveUpsManager();
    expect(mocks.mutate).not.toHaveBeenCalled();

    mocks.followedUps = [up(1), up(2)];
    LiveUpsManager();
    expect(mocks.mutate).toHaveBeenCalledOnce();

    mocks.followedUps = [];
    LiveUpsManager();
    expect(mocks.mutate).toHaveBeenCalledTimes(2);
  });

  test("keeps the current live ups when the followed list is unchanged", () => {
    mocks.followedUps = [up(1)];
    LiveUpsManager();
    LiveUpsManager();
    LiveUpsManager();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  test("survives a failed re-fetch", async () => {
    mocks.followedUps = [up(1)];
    LiveUpsManager();

    mocks.mutate.mockImplementationOnce(async () => {
      throw new Error("network down");
    });
    mocks.followedUps = [up(1), up(2)];
    LiveUpsManager();
    await Promise.resolve();

    expect(mocks.mutate).toHaveBeenCalledOnce();
  });

  test("mirrors the fetched live ups into the store", () => {
    mocks.followedUps = [up(1625060795)];
    mocks.data = { count: 1, items: [liveItem(1625060795)] };

    LiveUpsManager();

    expect(mocks.setLivingUps).toHaveBeenCalledExactlyOnceWith({
      "1625060795": "https://live.bilibili.com/1625060795",
    });
  });

  test("drops an up that is no longer followed before the live list refreshes", () => {
    mocks.followedUps = [up(1), up(2)];
    mocks.data = { count: 2, items: [liveItem(1), liveItem(2)] };
    LiveUpsManager();
    expect(mocks.setLivingUps).toHaveBeenLastCalledWith({
      "1": "https://live.bilibili.com/1",
      "2": "https://live.bilibili.com/2",
    });

    // 拉黑/取关后直播接口可能还没来得及更新，角标必须以本地关注列表为准。
    mocks.followedUps = [up(2)];
    LiveUpsManager();

    expect(mocks.setLivingUps).toHaveBeenLastCalledWith({ "2": "https://live.bilibili.com/2" });
  });

  test("ignores live ups that are not in the followed list", () => {
    mocks.followedUps = [up(1)];
    mocks.data = { count: 2, items: [liveItem(1), liveItem(2)] };

    LiveUpsManager();

    expect(mocks.setLivingUps).toHaveBeenCalledExactlyOnceWith({
      "1": "https://live.bilibili.com/1",
    });
  });
});
