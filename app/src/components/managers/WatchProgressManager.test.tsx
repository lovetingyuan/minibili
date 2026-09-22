import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initialed: true,
  account: { mid: "123", generation: 1 } as { mid: string; generation: number } | null,
  phase: "ready" as "ready" | "logging-out",
  generation: 1,
  ref: { current: undefined as unknown },
  sync: vi.fn(),
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
vi.mock("@/api/watch-progress", () => ({ syncWatchProgress: mocks.sync }));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSession: () => ({
    account: mocks.account,
    control: { phase: mocks.phase, generation: mocks.generation },
  }),
}));
vi.mock("@/store", () => ({ useStore: () => ({ initialed: mocks.initialed }) }));
vi.mock("@/store/watch-progress", () => ({ clearWatchProgress: mocks.clear }));

import WatchProgressManager from "./WatchProgressManager";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.initialed = true;
  mocks.account = { mid: "123", generation: 1 };
  mocks.phase = "ready";
  mocks.generation = 1;
  mocks.ref.current = undefined;
});

describe("watch progress store sync", () => {
  test("syncs the watch history of the active account exactly once", () => {
    WatchProgressManager();
    expect(mocks.sync).toHaveBeenCalledExactlyOnceWith({ mid: "123", generation: 1 });
    expect(mocks.clear).toHaveBeenCalledOnce();

    WatchProgressManager();
    expect(mocks.sync).toHaveBeenCalledOnce();
  });

  test("throws the previous account away and re-syncs after a session change", () => {
    WatchProgressManager();
    mocks.account = { mid: "456", generation: 2 };
    mocks.generation = 2;
    WatchProgressManager();
    expect(mocks.clear).toHaveBeenCalledTimes(2);
    expect(mocks.sync).toHaveBeenLastCalledWith({ mid: "456", generation: 2 });
    expect(mocks.sync).toHaveBeenCalledTimes(2);
  });

  test("keeps the store empty while logged out, logging out or before startup finished", () => {
    mocks.account = null;
    WatchProgressManager();
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.clear).toHaveBeenCalledOnce();

    mocks.account = { mid: "123", generation: 1 };
    mocks.initialed = false;
    WatchProgressManager();
    expect(mocks.sync).not.toHaveBeenCalled();

    mocks.initialed = true;
    mocks.phase = "logging-out";
    WatchProgressManager();
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});
