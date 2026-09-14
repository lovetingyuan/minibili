import { expect, test } from "vitest";

import {
  createVideoSource,
  formatPlaybackTime,
  isSeekJump,
  PLAYER_CONTROLS_AUTO_HIDE_MS,
  PLAYER_SEEK_STEP_SECONDS,
  PLAY_URL_MAX_REFRESH,
  resolveControlsAutoHideMs,
  resolveInlinePlayerHeight,
  resolvePlaybackFailover,
  resolvePreferredQuality,
  resolveSeekSwipeSeconds,
  resolveSeekTargetMs,
  resolveVerticalSwipe,
  shouldRestartPlayback,
  toggleControlsVisible,
} from "./player-helpers";

test("uses 1080P except on cellular without the high quality option", () => {
  expect(resolvePreferredQuality(false, false)).toBe(80);
  expect(resolvePreferredQuality(false, true)).toBe(80);
  expect(resolvePreferredQuality(true, true)).toBe(80);
  expect(resolvePreferredQuality(true, false)).toBe(64);
});

test("auto hides controls only while playing", () => {
  expect(resolveControlsAutoHideMs(true)).toBe(PLAYER_CONTROLS_AUTO_HIDE_MS);
  expect(resolveControlsAutoHideMs(false)).toBeNull();
});

test("toggles controls visibility on tap", () => {
  expect(toggleControlsVisible(true)).toBe(false);
  expect(toggleControlsVisible(false)).toBe(true);
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
  ).toBe(249);
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

test("expands only portrait videos to 70% of the screen height", () => {
  const portrait = { screenWidth: 400, screenHeight: 800, videoWidth: 1080, videoHeight: 1920 };
  expect(resolveInlinePlayerHeight({ ...portrait, expanded: true })).toBe(560);
  expect(resolveInlinePlayerHeight({ ...portrait, expanded: false })).toBe(264);
  expect(resolveInlinePlayerHeight(portrait)).toBe(264);
  // 横屏视频按宽高比铺满，不受展开影响
  const landscape = { screenWidth: 400, screenHeight: 800, videoWidth: 1920, videoHeight: 1080 };
  expect(resolveInlinePlayerHeight({ ...landscape, expanded: true })).toBe(249);
  // 宽高未知时按默认比例，同样不受展开影响
  expect(resolveInlinePlayerHeight({ screenWidth: 400, screenHeight: 800, expanded: true })).toBe(
    240,
  );
});

test("resolves vertical swipe direction by translation", () => {
  expect(resolveVerticalSwipe({ translationX: 0, translationY: 96 })).toBe("down");
  expect(resolveVerticalSwipe({ translationX: 0, translationY: -96 })).toBe("up");
  expect(resolveVerticalSwipe({ translationX: 0, translationY: 60 })).toBeNull();
  expect(resolveVerticalSwipe({ translationX: 0, translationY: -60 })).toBeNull();
  // 自定义阈值
  expect(resolveVerticalSwipe({ translationX: 0, translationY: 30, minDistance: 20 })).toBe("down");
  expect(resolveVerticalSwipe({ translationX: 0, translationY: 10, minDistance: 20 })).toBeNull();
  // 横向位移更大时忽略
  expect(resolveVerticalSwipe({ translationX: 120, translationY: 100 })).toBeNull();
  expect(resolveVerticalSwipe({ translationX: -120, translationY: -100 })).toBeNull();
  expect(resolveVerticalSwipe({ translationX: 20, translationY: 100 })).toBe("down");
});

test("resolves horizontal seek by translation", () => {
  // 右滑快进、左滑后退，一次滑动只调整 10s
  expect(resolveSeekSwipeSeconds({ translationX: 96, translationY: 0 })).toBe(
    PLAYER_SEEK_STEP_SECONDS,
  );
  expect(resolveSeekSwipeSeconds({ translationX: -96, translationY: 0 })).toBe(
    -PLAYER_SEEK_STEP_SECONDS,
  );
  // 达到最小滑动距离即触发
  expect(resolveSeekSwipeSeconds({ translationX: 40, translationY: 0 })).toBe(
    PLAYER_SEEK_STEP_SECONDS,
  );
  expect(resolveSeekSwipeSeconds({ translationX: -40, translationY: 0 })).toBe(
    -PLAYER_SEEK_STEP_SECONDS,
  );
  // 滑动距离不足时忽略
  expect(resolveSeekSwipeSeconds({ translationX: 39, translationY: 0 })).toBe(0);
  expect(resolveSeekSwipeSeconds({ translationX: -39, translationY: 0 })).toBe(0);
  // 纵向位移更大时忽略
  expect(resolveSeekSwipeSeconds({ translationX: 100, translationY: 120 })).toBe(0);
  expect(resolveSeekSwipeSeconds({ translationX: -100, translationY: -120 })).toBe(0);
  expect(resolveSeekSwipeSeconds({ translationX: 100, translationY: 20 })).toBe(
    PLAYER_SEEK_STEP_SECONDS,
  );
  // 自定义阈值与步长
  expect(
    resolveSeekSwipeSeconds({ translationX: 30, translationY: 0, minDistance: 20, stepSeconds: 5 }),
  ).toBe(5);
  expect(
    resolveSeekSwipeSeconds({
      translationX: -30,
      translationY: 0,
      minDistance: 20,
      stepSeconds: 5,
    }),
  ).toBe(-5);
  expect(
    resolveSeekSwipeSeconds({ translationX: 30, translationY: 0, minDistance: 40, stepSeconds: 5 }),
  ).toBe(0);
});

test("clamps the seek target into the playable range", () => {
  expect(resolveSeekTargetMs({ currentMs: 30_000, deltaMs: 10_000, durationMs: 120_000 })).toBe(
    40_000,
  );
  expect(resolveSeekTargetMs({ currentMs: 30_000, deltaMs: -10_000, durationMs: 120_000 })).toBe(
    20_000,
  );
  // 视频开头左滑
  expect(resolveSeekTargetMs({ currentMs: 5_000, deltaMs: -10_000, durationMs: 120_000 })).toBe(0);
  // 视频结尾右滑
  expect(resolveSeekTargetMs({ currentMs: 115_000, deltaMs: 10_000, durationMs: 120_000 })).toBe(
    120_000,
  );
  // 总时长未知时只保证不越过头
  expect(resolveSeekTargetMs({ currentMs: 115_000, deltaMs: 10_000, durationMs: 0 })).toBe(125_000);
  expect(resolveSeekTargetMs({ currentMs: 0, deltaMs: -10_000, durationMs: 0 })).toBe(0);
});

test("restarts playback only when the progress stopped at the end", () => {
  // 播放结束后进度停在总时长处，再次点击播放需要从头开始
  expect(shouldRestartPlayback({ currentMs: 120_000, durationMs: 120_000 })).toBe(true);
  expect(shouldRestartPlayback({ currentMs: 119_800, durationMs: 120_000 })).toBe(true);
  expect(shouldRestartPlayback({ currentMs: 119_000, durationMs: 120_000 })).toBe(false);
  // 中途暂停后继续播放
  expect(shouldRestartPlayback({ currentMs: 30_000, durationMs: 120_000 })).toBe(false);
  // 总时长未知时按普通续播处理
  expect(shouldRestartPlayback({ currentMs: 120_000, durationMs: 0 })).toBe(false);
  // 自定义容差
  expect(
    shouldRestartPlayback({ currentMs: 118_000, durationMs: 120_000, toleranceMs: 3000 }),
  ).toBe(true);
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
  expect(
    resolvePlaybackFailover({ index: 0, total: 0, refreshCount: PLAY_URL_MAX_REFRESH }),
  ).toEqual({ type: "give-up" });
});
