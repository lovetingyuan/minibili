import { beforeEach, expect, test, vi } from "vitest";
import type { UserDataAccount, UserDataDependencies } from "./types";

const state = vi.hoisted(() => ({
  account: { mid: "123", generation: 1 } as UserDataAccount | null,
  local: new Map<string, string>(),
  sync: vi.fn<UserDataDependencies["sync"]>(),
  toast: vi.fn(),
}));

vi.mock("react", () => ({
  useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
}));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }));
vi.mock("../../utils", () => ({ showToast: state.toast }));
vi.mock("../bilibili-session/session", () => ({
  bilibiliSession: {
    isCurrentAccount: (account: UserDataAccount) =>
      account.mid === state.account?.mid && account.generation === state.account.generation,
  },
}));
vi.mock("../bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: state.account }),
}));
vi.mock("./store", async () => {
  const { createUserDataController } = await import("./controller");
  return {
    userData: createUserDataController({
      read: async (key) => state.local.get(key) ?? null,
      write: async (key, value) => {
        state.local.set(key, value);
      },
      isCurrentAccount: (account) =>
        account.mid === state.account?.mid && account.generation === state.account.generation,
      sync: state.sync,
    }),
  };
});

import { UserDataUnauthorizedError } from "./errors";
import { userData } from "./store";
import { usePinnedUps } from "./usePinnedUps";

beforeEach(async () => {
  await userData.flushLocal();
  state.local.clear();
  state.sync.mockReset();
  state.toast.mockReset();
  state.account = null;
  await userData.activate(null);
  state.account = { mid: "123", generation: 1 };
  await userData.activate(state.account);
});

test("consecutive pin actions use the latest values, move existing pins first, and persist an empty list", async () => {
  const actions = usePinnedUps();
  expect(actions.disabled).toBe(false);
  expect(actions.pin(456)).toBe(true);
  expect(actions.pin("789")).toBe(true);
  expect(usePinnedUps().pinnedUpIds).toEqual(["789", "456"]);
  expect(actions.pin("456")).toBe(true);
  expect(usePinnedUps().pinnedUpIds).toEqual(["456", "789"]);
  expect(actions.unpin(456)).toBe(true);
  expect(usePinnedUps().pinnedUpIds).toEqual(["789"]);
  expect(actions.unpin("789")).toBe(true);
  await userData.flushLocal();
  expect(JSON.parse(state.local.get("UserData:uid:123")!)).toMatchObject({
    values: { $pinnedUpIds: [] },
    pendingKeys: ["$pinnedUpIds"],
  });
});

test("guest and settings hydration block pin changes", async () => {
  state.account = null;
  await userData.activate(null);
  expect(usePinnedUps().disabled).toBe(true);
  expect(usePinnedUps().pin(456)).toBe(false);
  state.account = { mid: "456", generation: 2 };
  const loading = userData.activate(state.account);
  expect(usePinnedUps().disabled).toBe(true);
  expect(usePinnedUps().pin(456)).toBe(false);
  await loading;
  expect(usePinnedUps().disabled).toBe(false);
  expect(usePinnedUps().pinnedUpIds).toEqual([]);
});

test("an open menu cannot change pins after its session expires or switches accounts", async () => {
  const actions = usePinnedUps();
  actions.pin(789);
  state.account = { mid: "456", generation: 2 };
  expect(usePinnedUps().pinnedUpIds).toEqual([]);
  expect(actions.pin(456)).toBe(false);
  expect(userData.getSnapshot().values.$pinnedUpIds).toEqual(["789"]);
  await userData.activate(state.account);
  expect(actions.unpin(789)).toBe(false);
  expect(usePinnedUps().pinnedUpIds).toEqual([]);
});

test("a 401 blocks both rendered and already-open menu actions", async () => {
  const actions = usePinnedUps();
  actions.pin(789);
  state.sync.mockRejectedValueOnce(new UserDataUnauthorizedError());
  await expect(userData.sync({ mid: "123", generation: 1 })).rejects.toBeInstanceOf(
    UserDataUnauthorizedError,
  );
  expect(usePinnedUps().disabled).toBe(true);
  expect(actions.pin(456)).toBe(false);
  expect(actions.unpin(789)).toBe(false);
  expect(usePinnedUps().pinnedUpIds).toEqual(["789"]);
});
