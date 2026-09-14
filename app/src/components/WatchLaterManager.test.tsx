import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initialed: true,
  account: { mid: "123", generation: 1 } as { mid: string; generation: number } | null,
  phase: "ready" as "ready" | "logging-out",
  data: undefined as unknown,
  ref: { current: null as unknown },
  replace: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: () => mocks.ref,
      useEffect: (effect: () => void | (() => void)) => effect(),
    },
  };
});
vi.mock("@/api/useWatchLater", () => ({
  useBilibiliWatchLater: () => ({ data: mocks.data }),
}));
vi.mock("@/api/watch-later", () => ({
  getWatchLaterListItems: (data?: { list?: { aid: number }[] }) =>
    (data?.list ?? []).map((item) => ({ aid: String(item.aid) })),
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSession: () => ({
    account: mocks.account,
    control: { phase: mocks.phase, generation: 1 },
  }),
}));
vi.mock("@/store", () => ({ useStore: () => ({ initialed: mocks.initialed }) }));
vi.mock("@/store/watch-later", () => ({
  clearWatchLaterAids: mocks.clear,
  replaceWatchLaterAids: mocks.replace,
}));

import WatchLaterManager from "./WatchLaterManager";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.initialed = true;
  mocks.account = { mid: "123", generation: 1 };
  mocks.phase = "ready";
  mocks.data = undefined;
  mocks.ref.current = undefined;
});

describe("watch later store sync", () => {
  test("fills the store with the fetched list of the active account", () => {
    mocks.data = { list: [{ aid: 1 }, { aid: 2 }] };
    WatchLaterManager();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(["1", "2"]);
    expect(mocks.clear).toHaveBeenCalledOnce();
  });

  test("throws the previous account away as soon as the session changes", () => {
    mocks.data = { list: [{ aid: 1 }] };
    WatchLaterManager();
    expect(mocks.clear).toHaveBeenCalledTimes(1);

    mocks.account = { mid: "456", generation: 2 };
    mocks.data = undefined;
    WatchLaterManager();
    expect(mocks.clear).toHaveBeenCalledTimes(2);
    expect(mocks.replace).toHaveBeenCalledOnce();
  });

  test("keeps the store empty while logged out or before startup finished", () => {
    mocks.account = null;
    mocks.data = { list: [{ aid: 1 }] };
    WatchLaterManager();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.clear).toHaveBeenCalledOnce();

    mocks.initialed = false;
    WatchLaterManager();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
});
