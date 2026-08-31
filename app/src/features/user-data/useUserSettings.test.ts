import { expect, test, vi } from "vitest";
import type { UserDataSnapshot } from "./types";

const mocks = vi.hoisted(() => ({
  session: { account: { mid: "123", generation: 1 } as { mid: string; generation: number } | null },
  current: true,
  setValue: vi.fn(),
  snapshot: {
    scope: "uid:123",
    generation: 1,
    values: { $blackTags: { private: "private" }, $videoCatesList: [], $pinnedUpIds: ["789"] },
    ready: true,
    syncing: false,
    authRequired: false,
    pendingCount: 1,
    revision: 1,
    error: null,
  } satisfies UserDataSnapshot,
}));
vi.mock("react", () => ({
  useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
}));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }));
vi.mock("../bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => mocks.session,
}));
vi.mock("./store", () => ({
  userData: { getSnapshot: () => mocks.snapshot, subscribe: vi.fn(), setValue: mocks.setValue },
}));
vi.mock("../../utils", () => ({ showToast: vi.fn() }));

import { useUserSettings } from "./useUserSettings";

test("hides the previous account's snapshot synchronously before the manager effect runs", () => {
  expect(useUserSettings().values.$blackTags).toEqual({ private: "private" });
  expect(useUserSettings().values.$pinnedUpIds).toEqual(["789"]);
  mocks.current = false;
  expect(useUserSettings().values.$blackTags).toEqual({});
  expect(useUserSettings().values.$pinnedUpIds).toEqual([]);
  expect(useUserSettings().pendingCount).toBe(0);
  mocks.current = true;
  mocks.session.account = { mid: "456", generation: 2 };
  expect(useUserSettings().values.$blackTags).toEqual({});
  expect(useUserSettings().values.$pinnedUpIds).toEqual([]);
  expect(useUserSettings().ready).toBe(false);
});
