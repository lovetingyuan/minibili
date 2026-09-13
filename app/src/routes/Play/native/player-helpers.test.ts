import { expect, test } from "vitest";

import {
  createVideoSource,
  formatPlaybackTime,
  isSeekJump,
  PLAY_URL_MAX_REFRESH,
  resolveInlinePlayerHeight,
  resolvePlaybackFailover,
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

test("builds a media source with a referer and without an android user agent", () => {
  const uri = "https://upos-sz-estghw.bilivideo.com/upgcxcode/14/03/36813670314/x.mp4?sig=1";
  const source = createVideoSource(uri);

  expect(source.uri).toBe(uri);
  expect(source.headers?.Referer).toBe("https://www.bilibili.com");
  // B站 CDN 会拒绝 UA 含 "android" 的请求，ExoPlayer 默认 UA 同样会被拒
  expect(source.headers?.["User-Agent"]).not.toMatch(/android/i);
});

test("falls back to the next cdn mirror before refreshing the play url", () => {
  expect(resolvePlaybackFailover({ index: 0, total: 3, refreshCount: 0 })).toEqual({
    type: "next-url",
    index: 1,
  });
  expect(resolvePlaybackFailover({ index: 2, total: 3, refreshCount: 0 })).toEqual({
    type: "refresh",
    index: 0,
    refreshCount: 1,
  });
  expect(resolvePlaybackFailover({ index: 0, total: 1, refreshCount: 0 })).toEqual({
    type: "refresh",
    index: 0,
    refreshCount: 1,
  });
});

test("gives up only after the refresh limit is reached", () => {
  expect(
    resolvePlaybackFailover({ index: 0, total: 1, refreshCount: PLAY_URL_MAX_REFRESH - 1 }),
  ).toEqual({ type: "refresh", index: 0, refreshCount: PLAY_URL_MAX_REFRESH });
  expect(
    resolvePlaybackFailover({ index: 0, total: 1, refreshCount: PLAY_URL_MAX_REFRESH }),
  ).toEqual({ type: "give-up" });
  expect(resolvePlaybackFailover({ index: 0, total: 0, refreshCount: PLAY_URL_MAX_REFRESH })).toEqual(
    { type: "give-up" },
  );
});
