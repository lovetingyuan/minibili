import { beforeEach, expect, test, vi } from "vitest";

import type {
  FollowingDynamicsNavBatch,
  FollowingDynamicsReadState,
} from "@/api/following-dynamics.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "account-1", generation: 4 } as {
    mid: string;
    generation: number;
  } | null,
  current: true,
  initialed: true,
  data: undefined as FollowingDynamicsNavBatch | undefined,
  readMap: {} as Record<string, FollowingDynamicsReadState>,
  ready: null as { mid: string; generation: number } | null,
  followingsGeneration: 4,
  followedUps: [{ mid: 42 }],
}));

vi.mock("react", () => ({
  default: {
    useEffect(effect: () => void) {
      effect();
    },
  },
}));
vi.mock("@/api/following-dynamics", async () => await import("../api/following-dynamics"));
vi.mock("@/api/useFollowingDynamicsNavUpdates", () => ({
  useFollowingDynamicsNavUpdates: () => ({ data: mocks.data }),
}));
vi.mock("@/features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account, control: { phase: "ready" } }),
}));
vi.mock("@/store", () => ({
  useStore: () => ({ initialed: mocks.initialed }),
  getStoreMethods: () => ({
    getFollowingsGeneration: () => mocks.followingsGeneration,
    get$followedUps: () => mocks.followedUps,
    set$followingDynamicsReadMap: (
      update: typeof mocks.readMap | ((current: typeof mocks.readMap) => typeof mocks.readMap),
    ) => {
      mocks.readMap = typeof update === "function" ? update(mocks.readMap) : update;
    },
    setFollowingDynamicsNavReadyAccount: (value: typeof mocks.ready) => {
      mocks.ready = value;
    },
  }),
}));

import FollowingDynamicsUnreadManager from "./FollowingDynamicsUnreadManager";

beforeEach(() => {
  mocks.account = { mid: "account-1", generation: 4 };
  mocks.current = true;
  mocks.initialed = true;
  mocks.data = undefined;
  mocks.readMap = {};
  mocks.ready = null;
  mocks.followingsGeneration = 4;
  mocks.followedUps = [{ mid: 42 }];
});

test("does not expose unread state until a current-account response succeeds", () => {
  mocks.initialed = false;
  mocks.data = { latestByMid: { "42": "1200000000000000005" }, complete: true };
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap).toEqual({});
  expect(mocks.ready).toBeNull();

  mocks.initialed = true;
  mocks.current = false;
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap).toEqual({});
  expect(mocks.ready).toBeNull();
});

test("seeds the first response and only advances latestId on later responses", () => {
  mocks.data = { latestByMid: { "42": "1200000000000000005" }, complete: true };
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap).toEqual({
    "account-1": {
      "42": {
        latestId: "1200000000000000005",
        readId: "1200000000000000005",
      },
    },
  });
  expect(mocks.ready).toEqual({ mid: "account-1", generation: 4 });

  mocks.data = { latestByMid: { "42": "1200000000000000006" }, complete: true };
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap["account-1"]["42"]).toEqual({
    latestId: "1200000000000000006",
    readId: "1200000000000000005",
  });
});

test("keeps missing ups and prunes them only after the followings sync confirms removal", () => {
  mocks.readMap = {
    "account-1": {
      "42": { latestId: "1200000000000000006", readId: "1200000000000000005" },
    },
  };
  mocks.data = { latestByMid: {}, complete: true };
  mocks.followingsGeneration = -1;
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap["account-1"]).toHaveProperty("42");

  mocks.followingsGeneration = 4;
  mocks.followedUps = [];
  FollowingDynamicsUnreadManager();
  expect(mocks.readMap["account-1"]).toEqual({});
});

test("clears the session-ready marker after logout", () => {
  mocks.ready = { mid: "account-1", generation: 4 };
  mocks.account = null;
  FollowingDynamicsUnreadManager();
  expect(mocks.ready).toBeNull();
});

test("keeps read states isolated when the active account changes", () => {
  mocks.data = { latestByMid: { "42": "1200000000000000005" }, complete: true };
  FollowingDynamicsUnreadManager();

  mocks.account = { mid: "account-2", generation: 5 };
  mocks.followingsGeneration = 5;
  mocks.data = { latestByMid: { "42": "1200000000000000009" }, complete: true };
  FollowingDynamicsUnreadManager();

  expect(mocks.readMap["account-1"]["42"].readId).toBe("1200000000000000005");
  expect(mocks.readMap["account-2"]["42"].readId).toBe("1200000000000000009");
  expect(mocks.ready).toEqual({ mid: "account-2", generation: 5 });
});
