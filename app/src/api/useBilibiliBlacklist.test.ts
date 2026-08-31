import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: { mid: "1", generation: 1 } as { mid: string; generation: number } | null,
  current: true,
  swr: vi.fn(),
  request: vi.fn(),
}));
vi.mock("swr", () => ({ default: mocks.swr }));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account, control: { phase: "ready" } }),
}));

import { useBilibiliBlacklist } from "./useBilibiliBlacklist";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { mid: "1", generation: 1 };
  mocks.current = true;
  mocks.swr.mockReturnValue({
    data: new Map([["42", { mid: 42, name: "UP", face: "", sign: "" }]]),
  });
});

test("name subscribers read cached IDs without initiating requests", () => {
  expect(useBilibiliBlacklist().blacklist.has("42")).toBe(true);
  expect(mocks.swr).toHaveBeenCalledWith(
    ["bilibili-blacklist", "1", 1],
    null,
    expect.objectContaining({
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: false,
    }),
  );
  expect(mocks.request).not.toHaveBeenCalled();
});

test("only the manager fetches and refreshes on focus or reconnect", () => {
  useBilibiliBlacklist(true);
  expect(mocks.swr).toHaveBeenCalledWith(
    ["bilibili-blacklist", "1", 1],
    expect.any(Function),
    expect.objectContaining({
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }),
  );
});

test("logout and stale sessions immediately hide cached IDs and disable requests", () => {
  mocks.current = false;
  expect(useBilibiliBlacklist(true).blacklist.size).toBe(0);
  expect(mocks.swr.mock.lastCall?.[0]).toBeNull();
  mocks.current = true;
  mocks.account = null;
  expect(useBilibiliBlacklist(true).blacklist.size).toBe(0);
  expect(mocks.swr.mock.lastCall?.[0]).toBeNull();
});
