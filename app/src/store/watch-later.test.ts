import { beforeEach, describe, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({
  aids: {} as Record<string, true>,
  writes: 0,
}));

vi.mock(".", () => ({
  getStoreMethods: () => ({
    getWatchLaterAids: () => state.aids,
    setWatchLaterAids: (next: Record<string, true>) => {
      state.aids = next;
      state.writes += 1;
    },
  }),
  useStore: () => ({ watchLaterAids: state.aids }),
}));

import {
  clearWatchLaterAids,
  isWatchLaterAdded,
  markWatchLaterAdded,
  markWatchLaterRemoved,
  replaceWatchLaterAids,
  useWatchLaterAids,
} from "./watch-later";

beforeEach(() => {
  state.aids = {};
  state.writes = 0;
});

describe("watch later aid set", () => {
  test("replaces the set and skips redundant writes", () => {
    replaceWatchLaterAids([1, "2", 2]);
    expect(state.aids).toEqual({ "1": true, "2": true });
    replaceWatchLaterAids(["2", "1"]);
    expect(state.writes).toBe(1);
    replaceWatchLaterAids(["1"]);
    expect(state.aids).toEqual({ "1": true });
    expect(state.writes).toBe(2);
  });

  test("ignores ids that are not positive integers", () => {
    replaceWatchLaterAids(["", "abc", "0", "-1", 3]);
    expect(state.aids).toEqual({ "3": true });
    markWatchLaterAdded("abc");
    expect(state.writes).toBe(1);
  });

  test("marks a single video added or removed without redundant writes", () => {
    markWatchLaterAdded("7");
    expect(state.aids).toEqual({ "7": true });
    markWatchLaterAdded("7");
    expect(state.writes).toBe(1);
    expect(isWatchLaterAdded(7)).toBe(true);

    markWatchLaterRemoved("7");
    expect(state.aids).toEqual({});
    markWatchLaterRemoved("7");
    expect(state.writes).toBe(2);
    expect(isWatchLaterAdded(7)).toBe(false);
  });

  test("clears only when there is something to clear", () => {
    clearWatchLaterAids();
    expect(state.writes).toBe(0);
    markWatchLaterAdded("7");
    clearWatchLaterAids();
    expect(state.aids).toEqual({});
    expect(state.writes).toBe(2);
  });

  test("exposes the current set to components and treats missing ids as absent", () => {
    state.aids = { "9": true };
    expect(useWatchLaterAids()).toBe(state.aids);
    expect(isWatchLaterAdded(undefined)).toBe(false);
    expect(isWatchLaterAdded(null)).toBe(false);
  });
});
