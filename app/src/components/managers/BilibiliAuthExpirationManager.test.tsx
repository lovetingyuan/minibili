import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logout: vi.fn<() => Promise<void>>(),
  handled: { current: 0 },
  snapshot: {
    error: new Error("expired") as Error | null,
    version: 1,
  },
}));

vi.mock("react", () => ({
  default: {
    useSyncExternalStore: () => mocks.snapshot,
    useRef: () => mocks.handled,
    useEffect: (effect: () => void) => effect(),
  },
}));
vi.mock("@/features/bilibili-session/auth-expiration", () => ({
  bilibiliAuthExpiration: { subscribe: vi.fn(), getSnapshot: vi.fn() },
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionActions: () => ({ logout: mocks.logout }),
}));

import BilibiliAuthExpirationManager from "./BilibiliAuthExpirationManager";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.handled.current = 0;
  mocks.snapshot = { error: new Error("expired"), version: 1 };
  mocks.logout.mockResolvedValue();
});

test("登录失效时只清理一次本地登录态", async () => {
  BilibiliAuthExpirationManager();
  BilibiliAuthExpirationManager();
  await Promise.resolve();
  await Promise.resolve();

  expect(mocks.logout).toHaveBeenCalledOnce();
});

test("退出清理失败时不打断页面", async () => {
  mocks.logout.mockRejectedValue(new Error("cleanup failed"));

  BilibiliAuthExpirationManager();
  await Promise.resolve();
  await Promise.resolve();

  expect(mocks.logout).toHaveBeenCalledOnce();
});
