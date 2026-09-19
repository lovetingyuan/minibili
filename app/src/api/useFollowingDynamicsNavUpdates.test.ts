import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: { mid: "123", generation: 4 } as { mid: string; generation: number } | null,
  control: { phase: "ready" } as { phase: string },
  current: true,
  initialed: false,
  swr: vi.fn(),
  fetchUpdates: vi.fn(),
}));

vi.mock("swr", () => ({ default: mocks.swr }));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account, control: mocks.control }),
}));
vi.mock("../store", () => ({ useStore: () => ({ initialed: mocks.initialed }) }));
vi.mock("./fetcher", () => ({ default: vi.fn() }));
vi.mock("./following-dynamics", () => ({
  fetchFollowingDynamicsNavUpdates: mocks.fetchUpdates,
}));

import { useFollowingDynamicsNavUpdates } from "./useFollowingDynamicsNavUpdates";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { mid: "123", generation: 4 };
  mocks.control = { phase: "ready" };
  mocks.current = true;
  mocks.initialed = false;
  mocks.swr.mockReturnValue({ data: undefined });
  mocks.fetchUpdates.mockResolvedValue({ latestByMid: {}, complete: true });
});

test("does not request nav updates before store hydration or for an inactive session", () => {
  useFollowingDynamicsNavUpdates();
  expect(mocks.swr.mock.calls[0][0]).toBeNull();

  mocks.initialed = true;
  mocks.control = { phase: "logging-out" };
  useFollowingDynamicsNavUpdates();
  expect(mocks.swr.mock.calls[1][0]).toBeNull();

  mocks.control = { phase: "ready" };
  mocks.current = false;
  useFollowingDynamicsNavUpdates();
  expect(mocks.swr.mock.calls[2][0]).toBeNull();
});

test("uses an account-scoped key that is independent from read-state writes", async () => {
  mocks.initialed = true;
  useFollowingDynamicsNavUpdates();

  const [key, load, options] = mocks.swr.mock.calls[0];
  expect(key).toEqual(["bilibili-following-dynamics-nav", "123", 4]);
  expect(options).toMatchObject({
    refreshInterval: 10 * 60 * 1000,
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  await load();
  expect(mocks.fetchUpdates).toHaveBeenCalledOnce();
  const isCurrentAccount = mocks.fetchUpdates.mock.calls[0][1] as () => boolean;
  expect(isCurrentAccount()).toBe(true);
  mocks.current = false;
  expect(isCurrentAccount()).toBe(false);
});
