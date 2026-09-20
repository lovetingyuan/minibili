import { describe, expect, test } from "vitest";

import {
  DEFAULT_PLAYBACK_MODE,
  resolveNextPageOnEnded,
  toggleAutoNextMode,
  toggleLoopMode,
  willContinueAfterEnded,
} from "./playback-mode";

describe("playback mode", () => {
  test("defaults to auto next without looping", () => {
    expect(DEFAULT_PLAYBACK_MODE).toEqual({ autoNext: true, loop: false });
  });

  test("keeps loop and auto next mutually exclusive while allowing both off", () => {
    const loop = toggleLoopMode(DEFAULT_PLAYBACK_MODE);
    expect(loop).toEqual({ autoNext: false, loop: true });
    expect(toggleLoopMode(loop)).toEqual({ autoNext: false, loop: false });

    const autoNext = toggleAutoNextMode({ autoNext: false, loop: true });
    expect(autoNext).toEqual({ autoNext: true, loop: false });
    expect(toggleAutoNextMode(autoNext)).toEqual({ autoNext: false, loop: false });
  });

  test("advances only for the current source with auto next enabled", () => {
    const base = {
      currentCid: 102,
      currentPage: 2,
      ended: { cid: 102, page: 2 },
      mode: DEFAULT_PLAYBACK_MODE,
      pageCount: 3,
    };
    expect(resolveNextPageOnEnded(base)).toBe(3);
    expect(resolveNextPageOnEnded({ ...base, ended: { cid: 101, page: 1 } })).toBeNull();
    expect(resolveNextPageOnEnded({ ...base, mode: { autoNext: false, loop: false } })).toBeNull();
    expect(resolveNextPageOnEnded({ ...base, mode: { autoNext: false, loop: true } })).toBeNull();
    expect(resolveNextPageOnEnded({ ...base, currentPage: 3 })).toBeNull();
  });

  test("continues after the ended only with loop or a next part", () => {
    const base = { currentPage: 2, pageCount: 3, mode: DEFAULT_PLAYBACK_MODE };
    expect(willContinueAfterEnded(base)).toBe(true);
    expect(willContinueAfterEnded({ ...base, mode: { autoNext: false, loop: true } })).toBe(true);
    expect(willContinueAfterEnded({ ...base, mode: { autoNext: false, loop: false } })).toBe(false);
    // 自动连播已经到最后一个分 P 时同样不会继续播放
    expect(willContinueAfterEnded({ ...base, currentPage: 3 })).toBe(false);
  });
});
