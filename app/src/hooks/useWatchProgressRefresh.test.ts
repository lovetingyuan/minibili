import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  focused: true,
  current: true,
  account: { mid: "123", generation: 1 } as { mid: string; generation: number } | null,
  refresh: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useEffect: (effect: () => void | (() => void)) => effect(),
    },
  };
});
vi.mock("@react-navigation/native", () => ({ useIsFocused: () => mocks.focused }));
vi.mock("@/api/watch-progress", () => ({ refreshRecentWatchProgress: mocks.refresh }));
vi.mock("@/features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));

import { useWatchProgressRefresh } from "./useWatchProgressRefresh";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.focused = true;
  mocks.current = true;
  mocks.account = { mid: "123", generation: 1 };
});

describe("watch progress refresh on leaving the player", () => {
  test("refreshes the newest records once the focused player is left", () => {
    useWatchProgressRefresh();
    expect(mocks.refresh).not.toHaveBeenCalled();

    mocks.focused = false;
    useWatchProgressRefresh();
    expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith({ mid: "123", generation: 1 });
  });

  test("stays quiet while logged out or with an expired session", () => {
    mocks.focused = false;
    mocks.account = null;
    useWatchProgressRefresh();
    expect(mocks.refresh).not.toHaveBeenCalled();

    mocks.account = { mid: "123", generation: 1 };
    mocks.current = false;
    useWatchProgressRefresh();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
