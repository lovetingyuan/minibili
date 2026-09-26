import { describe, expect, test } from "vitest";

import {
  createVideoSource,
  formatPlaybackTime,
  isSeekJump,
  PLAYER_CONTROLS_AUTO_HIDE_MS,
  PLAYER_SEEK_STEP_SECONDS,
  PLAY_URL_MAX_REFRESH,
  resolveControlsAutoHideMs,
  resolveInlinePlayerHeight,
  resolveInitialResumeDecision,
  resolveInitialResumeSnapshot,
  resolveLimitedEndedUi,
  resolvePlaybackDisplayMs,
  resolvePlayerResumeDecision,
  resolvePlaybackFailover,
  resolvePreferredQuality,
  resolveSeekSwipeSeconds,
  resolveSeekTargetMs,
  resolveVerticalSwipe,
  shouldAutoStartPlayback,
  shouldLoadVideoStream,
  shouldPausePlaybackOnNetworkChange,
  shouldShowResumeButton,
  shouldRestartPlayback,
  toggleControlsVisible,
} from "./player-helpers";

describe("initial resume", () => {
  test("keeps the entry snapshot when playback progress is persisted later", () => {
    const initial = resolveInitialResumeSnapshot({ key: "", positionMs: null }, "BV1:101", null);
    const afterPeriodicWrite = resolveInitialResumeSnapshot(initial, "BV1:101", 15_000);

    expect(afterPeriodicWrite).toBe(initial);
    expect(afterPeriodicWrite.positionMs).toBeNull();
  });

  test("takes a new snapshot after switching parts", () => {
    const first = resolveInitialResumeSnapshot({ key: "", positionMs: null }, "BV1:101", 8_000);

    expect(resolveInitialResumeSnapshot(first, "BV1:102", 23_000)).toEqual({
      key: "BV1:102",
      positionMs: 23_000,
    });
  });

  test("applies a valid resume only before playback starts", () => {
    expect(
      resolveInitialResumeDecision({
        handled: true,
        positionMs: 20_000,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: false,
      }),
    ).toBe("consume");
    expect(
      resolveInitialResumeDecision({
        handled: false,
        positionMs: 20_000,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: false,
      }),
    ).toBe("apply");
    expect(
      resolveInitialResumeDecision({
        handled: false,
        positionMs: 20_000,
        currentTimeMs: 15_000,
        ready: true,
        hasPlayed: false,
      }),
    ).toBe("consume");
    expect(
      resolveInitialResumeDecision({
        handled: false,
        positionMs: 20_000,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: true,
      }),
    ).toBe("consume");
  });

  test("waits for a positive position and a ready player", () => {
    expect(
      resolveInitialResumeDecision({
        handled: false,
        positionMs: 0,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: false,
      }),
    ).toBe("wait");
    expect(
      resolveInitialResumeDecision({
        handled: false,
        positionMs: 20_000,
        currentTimeMs: 0,
        ready: false,
        hasPlayed: false,
      }),
    ).toBe("wait");
  });

  test("keeps CDN failover resume independent from the initial position", () => {
    expect(
      resolvePlayerResumeDecision({
        handled: true,
        positionMs: 8_000,
        failoverPositionMs: 42_000,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: false,
      }),
    ).toEqual({ type: "apply", origin: "failover", positionMs: 42_000 });
    expect(
      resolvePlayerResumeDecision({
        handled: false,
        positionMs: 8_000,
        failoverPositionMs: 0,
        currentTimeMs: 0,
        ready: true,
        hasPlayed: false,
      }),
    ).toEqual({ type: "apply", origin: "initial", positionMs: 8_000 });
  });
});

test("uses 1080P only on WiFi unless the high quality option was turned on", () => {
  expect(resolvePreferredQuality("wifi", false)).toBe(80);
  expect(resolvePreferredQuality("wifi", true)).toBe(80);
  expect(resolvePreferredQuality("metered", false)).toBe(64);
  expect(resolvePreferredQuality("metered", true)).toBe(80);
  // 断网或网络状态未知时不能默认高清晰度
  expect(resolvePreferredQuality("offline", false)).toBe(64);
  expect(resolvePreferredQuality("unknown", false)).toBe(64);
});

test("auto starts playback only on WiFi with a play url", () => {
  expect(shouldAutoStartPlayback("wifi", true)).toBe(true);
  expect(shouldAutoStartPlayback("wifi", false)).toBe(false);
  expect(shouldAutoStartPlayback("metered", true)).toBe(false);
  expect(shouldAutoStartPlayback("offline", true)).toBe(false);
  expect(shouldAutoStartPlayback("unknown", true)).toBe(false);
});

test("loads the video stream only on WiFi or after the user started playback", () => {
  // WiFi 下保持进页面即预加载
  expect(shouldLoadVideoStream({ networkUsage: "wifi", started: false })).toBe(true);
  expect(shouldLoadVideoStream({ networkUsage: "wifi", started: true })).toBe(true);
  // 流量下不能预加载，只有用户点击封面后才开始拉流
  expect(shouldLoadVideoStream({ networkUsage: "metered", started: false })).toBe(false);
  expect(shouldLoadVideoStream({ networkUsage: "metered", started: true })).toBe(true);
  // 断网与网络状态未知同样按省流处理
  expect(shouldLoadVideoStream({ networkUsage: "offline", started: false })).toBe(false);
  expect(shouldLoadVideoStream({ networkUsage: "offline", started: true })).toBe(true);
  expect(shouldLoadVideoStream({ networkUsage: "unknown", started: false })).toBe(false);
  expect(shouldLoadVideoStream({ networkUsage: "unknown", started: true })).toBe(true);
});

test("pauses playback only when the network switches to metered", () => {
  expect(shouldPausePlaybackOnNetworkChange("wifi", "metered")).toBe(true);
  expect(shouldPausePlaybackOnNetworkChange("metered", "metered")).toBe(false);
  // 切回 WiFi 或断网都不打断播放，避免重建播放器导致视频从头开始
  expect(shouldPausePlaybackOnNetworkChange("metered", "wifi")).toBe(false);
  expect(shouldPausePlaybackOnNetworkChange("wifi", "offline")).toBe(false);
});

test("auto hides controls only while playing", () => {
  expect(resolveControlsAutoHideMs(true)).toBe(PLAYER_CONTROLS_AUTO_HIDE_MS);
  expect(resolveControlsAutoHideMs(false)).toBeNull();
});

test("toggles controls visibility on tap", () => {
  expect(toggleControlsVisible(true)).toBe(false);
  expect(toggleControlsVisible(false)).toBe(true);
});

const playingResumeOptions = {
  started: true,
  videoVisible: true,
  playbackStarted: true,
  paused: true,
  hasError: false,
  overlayVisible: false,
};

test("shows the resume button after the playback was paused", () => {
  expect(shouldShowResumeButton(playingResumeOptions)).toBe(true);
});

test("keeps the resume button hidden before the playback really started", () => {
  // 首帧渲染比 playingChange 先到时播放还没开始，
  // 此时展示按钮会在转圈消失后闪一下
  expect(shouldShowResumeButton({ ...playingResumeOptions, playbackStarted: false })).toBe(false);
  expect(shouldShowResumeButton({ ...playingResumeOptions, paused: false })).toBe(false);
});

test("hides the resume button before the video is prepared", () => {
  expect(shouldShowResumeButton({ ...playingResumeOptions, started: false })).toBe(false);
  expect(shouldShowResumeButton({ ...playingResumeOptions, videoVisible: false })).toBe(false);
});

test("hides the resume button when an overlay covers the video", () => {
  expect(shouldShowResumeButton({ ...playingResumeOptions, hasError: true })).toBe(false);
  expect(shouldShowResumeButton({ ...playingResumeOptions, overlayVisible: true })).toBe(false);
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

test("aligns the displayed time with the duration once the playback ended", () => {
  // 最后一次 timeUpdate 停在 211.8s，展示 03:31/03:32 会和总时长差一秒
  expect(resolvePlaybackDisplayMs({ currentMs: 211_800, durationMs: 212_000, ended: false })).toBe(
    211_800,
  );
  expect(resolvePlaybackDisplayMs({ currentMs: 211_800, durationMs: 212_000, ended: true })).toBe(
    212_000,
  );
});

test("keeps following the scrub position after the playback ended", () => {
  expect(
    resolvePlaybackDisplayMs({
      currentMs: 211_800,
      durationMs: 212_000,
      ended: true,
      scrubMs: 60_000,
    }),
  ).toBe(60_000);
  expect(
    resolvePlaybackDisplayMs({
      currentMs: 211_800,
      durationMs: 212_000,
      ended: false,
      scrubMs: 60_000,
    }),
  ).toBe(60_000);
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

test("puts the video title into the now playing metadata", () => {
  const source = createVideoSource("https://upos-sz-estghw.bilivideo.com/x.mp4", "【测试】标题");

  expect(source.metadata).toEqual({ title: "【测试】标题", artist: "MiniBili" });
});

test("keeps the app name in now playing metadata when there is no title", () => {
  expect(createVideoSource("https://upos-sz-estghw.bilivideo.com/x.mp4").metadata).toEqual({
    artist: "MiniBili",
  });
  expect(createVideoSource("https://upos-sz-estghw.bilivideo.com/x.mp4", "").metadata).toEqual({
    artist: "MiniBili",
  });
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

test("keeps the in-player notice only for interactive videos", () => {
  // 交互视频片段本身看不完整，继续在播放器里弹「暂不支持」
  expect(resolveLimitedEndedUi("interactive")).toEqual({ showNotice: true, ended: false });
});

test("treats preview segments as a normal playback end", () => {
  // 试看说明改到播放器下方的视频信息区，播放器只回到封面
  expect(resolveLimitedEndedUi("charge")).toEqual({ showNotice: false, ended: true });
  expect(resolveLimitedEndedUi("paid")).toEqual({ showNotice: false, ended: true });
});
