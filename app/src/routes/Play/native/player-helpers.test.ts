import { expect, test } from "vitest";

import {
  formatPlaybackTime,
  isSeekJump,
  resolveInlinePlayerHeight,
  resolvePreferredQuality,
  resolveTapAction,
} from "./player-helpers";

test("uses 1080P except on cellular without the high quality option", () => {
  expect(resolvePreferredQuality(false, false)).toBe(80);
  expect(resolvePreferredQuality(false, true)).toBe(80);
  expect(resolvePreferredQuality(true, true)).toBe(80);
  expect(resolvePreferredQuality(true, false)).toBe(64);
});

test("only resumes playback on a single tap while paused", () => {
  expect(resolveTapAction(false)).toBe("play");
  expect(resolveTapAction(true)).toBe("none");
});

test("treats big playback jumps as seek", () => {
  expect(isSeekJump(1000, 2000)).toBe(false);
  expect(isSeekJump(1000, 2501)).toBe(true);
  expect(isSeekJump(10000, 100)).toBe(true);
});

test("formats playback time with and without hours", () => {
  expect(formatPlaybackTime(0)).toBe("00:00");
  expect(formatPlaybackTime(65)).toBe("01:05");
  expect(formatPlaybackTime(3725)).toBe("1:02:05");
  expect(formatPlaybackTime(Number.NaN)).toBe("00:00");
});

test("computes inline player height for landscape and portrait videos", () => {
  expect(
    resolveInlinePlayerHeight({
      screenWidth: 400,
      screenHeight: 800,
      videoWidth: 1920,
      videoHeight: 1080,
    }),
  ).toBe(225);
  expect(
    resolveInlinePlayerHeight({
      screenWidth: 400,
      screenHeight: 800,
      videoWidth: 1080,
      videoHeight: 1920,
    }),
  ).toBe(264);
  expect(resolveInlinePlayerHeight({ screenWidth: 400, screenHeight: 800 })).toBe(240);
});
