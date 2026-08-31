import { beforeEach, describe, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({
  control: { generation: 1, phase: "ready" },
  followingsGeneration: -1,
  ups: [{ mid: 456, name: "cached", face: "", sign: "" }],
}));

vi.mock(".", () => ({
  getStoreMethods: () => ({
    getFollowingsGeneration: () => state.followingsGeneration,
    get$followedUps: () => state.ups,
  }),
}));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { getSnapshot: () => state.control },
}));

import { getActiveFollowedUps } from "./followings";

beforeEach(() => {
  state.control = { generation: 1, phase: "ready" };
  state.followingsGeneration = -1;
});

describe("active account followings", () => {
  test("keeps legacy disk data inactive until a complete sync succeeds", () => {
    expect(getActiveFollowedUps()).toEqual([]);
    expect(state.ups).toHaveLength(1);
    state.followingsGeneration = 1;
    expect(getActiveFollowedUps()).toBe(state.ups);
  });

  test("hides the previous account immediately after logout and after switching accounts", () => {
    state.followingsGeneration = 1;
    state.control = { generation: 2, phase: "logging-out" };
    expect(getActiveFollowedUps()).toEqual([]);
    state.control.phase = "ready";
    expect(getActiveFollowedUps()).toEqual([]);
    expect(state.ups).toHaveLength(1);
    state.followingsGeneration = 2;
    expect(getActiveFollowedUps()).toBe(state.ups);
  });

  test("keeps cached followings inactive while logout cleanup has failed", () => {
    state.followingsGeneration = 1;
    state.control.phase = "logout-error";
    expect(getActiveFollowedUps()).toEqual([]);
  });
});
