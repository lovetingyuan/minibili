import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  PlayHeartbeatAccount,
  PlayHeartbeatReport,
  PlayHeartbeatSession,
  PlayHeartbeatVideo,
} from "@/api/play-heartbeat.types";

const mocks = vi.hoisted(() => ({
  refs: [] as { current: unknown }[],
  refIndex: 0,
  cleanups: [] as (() => void)[],
  account: { mid: "123", generation: 1 } as PlayHeartbeatAccount | null,
  sessions: [] as PlayHeartbeatSession[],
  sessionCount: 0,
  start: vi.fn(
    async (
      _account: PlayHeartbeatAccount,
      _video: PlayHeartbeatVideo,
      _session: PlayHeartbeatSession,
    ) => {},
  ),
  heartbeat: vi.fn(
    async (
      _account: PlayHeartbeatAccount,
      _video: PlayHeartbeatVideo,
      _session: PlayHeartbeatSession,
      _report: PlayHeartbeatReport,
    ) => {},
  ),
  localProgress: [] as { bvid: string; ratio: number }[],
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: (initial: unknown) => {
        const index = mocks.refIndex++;
        mocks.refs[index] ??= { current: initial };
        return mocks.refs[index];
      },
      useEffect: (effect: () => void | (() => void)) => {
        const cleanup = effect();
        if (typeof cleanup === "function") {
          mocks.cleanups.push(cleanup);
        }
      },
    },
  };
});

vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));

vi.mock("@/features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => true },
}));

vi.mock("@/api/play-heartbeat", () => ({
  PLAY_HEARTBEAT_TYPES: { periodic: 0, start: 1, pause: 2, resume: 3, end: 4 },
  playHeartbeatRequestDependencies: {},
  createPlayHeartbeatSession: (nowMs: number, playedTime = 0) => {
    const session: PlayHeartbeatSession = {
      session: `session-${++mocks.sessionCount}`,
      startTs: Math.floor(nowMs / 1000),
      maxPlayedTime: Math.max(0, Math.round(playedTime)),
    };
    mocks.sessions.push(session);
    return session;
  },
  reportPlayStart: mocks.start,
  reportPlayHeartbeat: mocks.heartbeat,
}));

vi.mock("@/store/watch-progress", () => ({
  recordLocalWatchProgress: (bvid: string, ratio: number) => {
    mocks.localProgress.push({ bvid, ratio });
  },
}));

import {
  PLAY_HEARTBEAT_INTERVAL_MS,
  usePlayHeartbeatReporter,
  type PlayHeartbeatReporterProps,
} from "./usePlayHeartbeatReporter";

const START_TIME = 1789486400_000;

function render(props: Partial<PlayHeartbeatReporterProps> = {}) {
  mocks.refIndex = 0;
  return usePlayHeartbeatReporter({
    bvid: "BV1HS421w7wG",
    aid: "1501398719",
    cid: 1458260037,
    page: 1,
    durationSeconds: 600,
    quality: 80,
    isPlaying: true,
    currentTimeMs: 30_000,
    ...props,
  });
}

function unmount() {
  const cleanups = [...mocks.cleanups];
  mocks.cleanups = [];
  for (const cleanup of cleanups) {
    cleanup();
  }
}

function reportedTypes() {
  return mocks.heartbeat.mock.calls.map((call) => call[3].type);
}

function lastReport() {
  const calls = mocks.heartbeat.mock.calls;
  return calls[calls.length - 1]?.[3];
}

function lastLocalProgress() {
  return mocks.localProgress[mocks.localProgress.length - 1];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START_TIME);
  vi.clearAllMocks();
  mocks.refs = [];
  mocks.refIndex = 0;
  mocks.cleanups = [];
  mocks.sessions = [];
  mocks.sessionCount = 0;
  mocks.account = { mid: "123", generation: 1 };
  mocks.localProgress = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("play heartbeat reporter", () => {
  test("starts a session and reports play_type=1 when playback begins", () => {
    render({ currentTimeMs: 30_000 });
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.start.mock.calls[0][1]).toEqual({
      aid: "1501398719",
      bvid: "BV1HS421w7wG",
      cid: 1458260037,
      page: 1,
    });
    expect(reportedTypes()).toEqual([1]);
    expect(lastReport()).toEqual({
      type: 1,
      playedTime: 30,
      realPlayedTime: 0,
      videoDuration: 600,
      quality: 80,
    });
  });

  test("reports play_type=0 every 15 seconds while playing", () => {
    render({ currentTimeMs: 0 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS - 1);
    expect(reportedTypes()).toEqual([1]);

    vi.advanceTimersByTime(1);
    expect(lastReport()).toEqual({
      type: 0,
      playedTime: 0,
      realPlayedTime: 15,
      videoDuration: 600,
      quality: 80,
    });

    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(reportedTypes()).toEqual([1, 0, 0]);
    expect(lastReport()).toMatchObject({ realPlayedTime: 30 });
  });

  test("records the local progress along with every report", () => {
    render({ currentTimeMs: 30_000 });
    expect(mocks.localProgress).toEqual([{ bvid: "BV1HS421w7wG", ratio: 0.05 }]);

    vi.advanceTimersByTime(10_000);
    render({ currentTimeMs: 60_000, isPlaying: false });
    expect(lastReport()).toMatchObject({ type: 2, playedTime: 60 });
    expect(lastLocalProgress()).toEqual({ bvid: "BV1HS421w7wG", ratio: 0.1 });
  });

  test("records the local progress of the position when leaving the play screen", () => {
    render({ currentTimeMs: 60_000 });
    vi.advanceTimersByTime(20_000);
    render({ currentTimeMs: 180_000 });
    mocks.localProgress = [];
    unmount();

    expect(lastReport()).toMatchObject({ type: 2, playedTime: 180 });
    expect(lastLocalProgress()).toEqual({ bvid: "BV1HS421w7wG", ratio: 0.3 });
  });

  test("records a full bar when the video plays to the end", () => {
    const first = render({ currentTimeMs: 590_000 });
    vi.advanceTimersByTime(5_000);
    mocks.localProgress = [];
    first.reportEnded();

    expect(lastReport()).toMatchObject({ type: 4, playedTime: -1 });
    expect(lastLocalProgress()).toEqual({ bvid: "BV1HS421w7wG", ratio: 1 });
  });

  test("records nothing while the position or the duration is unknown", () => {
    render({ currentTimeMs: 0 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(mocks.heartbeat).toHaveBeenCalledTimes(2);
    expect(mocks.localProgress).toEqual([]);
  });

  test("keeps the played time short when the progress bar is dragged", () => {
    render({ currentTimeMs: 30_000 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    render({ currentTimeMs: 300_000 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);

    expect(lastReport()).toEqual({
      type: 0,
      playedTime: 300,
      realPlayedTime: 30,
      videoDuration: 600,
      quality: 80,
    });
    expect(lastReport()?.type).toBe(0);
    expect(mocks.sessions[0].maxPlayedTime).toBe(300);
  });

  test("reports pause and resume while keeping the same session", () => {
    render({ currentTimeMs: 30_000 });
    vi.advanceTimersByTime(10_000);
    render({ currentTimeMs: 40_000, isPlaying: false });
    expect(lastReport()).toEqual({
      type: 2,
      playedTime: 40,
      realPlayedTime: 10,
      videoDuration: 600,
      quality: 80,
    });

    // 暂停期间不再上报，累计播放时长也不增长
    vi.advanceTimersByTime(60_000);
    expect(reportedTypes()).toEqual([1, 2]);

    render({ currentTimeMs: 40_000, isPlaying: true });
    expect(lastReport()).toEqual({
      type: 3,
      playedTime: 40,
      realPlayedTime: 10,
      videoDuration: 600,
      quality: 80,
    });
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.heartbeat.mock.calls[1][2].session).toBe(mocks.sessions[0].session);
    expect(mocks.heartbeat.mock.calls[2][2].session).toBe(mocks.sessions[0].session);
  });

  test("reports the end of the video and starts a new session on replay", () => {
    const first = render({ currentTimeMs: 590_000 });
    vi.advanceTimersByTime(5_000);
    first.reportEnded();
    expect(lastReport()).toEqual({
      type: 4,
      playedTime: -1,
      realPlayedTime: 5,
      videoDuration: 600,
      quality: 80,
    });

    vi.advanceTimersByTime(60_000);
    expect(reportedTypes()).toEqual([1, 4]);

    render({ currentTimeMs: 0 });
    expect(mocks.start).toHaveBeenCalledTimes(2);
    expect(lastReport()).toEqual({
      type: 1,
      playedTime: 0,
      realPlayedTime: 0,
      videoDuration: 600,
      quality: 80,
    });
    expect(mocks.sessions[1].session).not.toBe(mocks.sessions[0].session);
  });

  test("flushes a pause report when the play screen unmounts", () => {
    render({ currentTimeMs: 60_000 });
    vi.advanceTimersByTime(20_000);
    mocks.heartbeat.mockClear();
    unmount();
    expect(lastReport()).toEqual({
      type: 2,
      playedTime: 60,
      realPlayedTime: 20,
      videoDuration: 600,
      quality: 80,
    });

    vi.advanceTimersByTime(60_000);
    expect(mocks.heartbeat).toHaveBeenCalledOnce();
  });

  test("flushes the previous page before starting the new one", () => {
    render({ currentTimeMs: 100_000 });
    vi.advanceTimersByTime(10_000);
    mocks.heartbeat.mockClear();
    render({ cid: 999, page: 2, currentTimeMs: 0 });

    expect(reportedTypes()).toEqual([2, 1]);
    expect(mocks.heartbeat.mock.calls[0][1]).toEqual({
      aid: "1501398719",
      bvid: "BV1HS421w7wG",
      cid: 1458260037,
      page: 1,
    });
    expect(mocks.heartbeat.mock.calls[1][1]).toEqual({
      aid: "1501398719",
      bvid: "BV1HS421w7wG",
      cid: 999,
      page: 2,
    });
    expect(mocks.start).toHaveBeenCalledTimes(2);
  });

  test("does not report while logged out", () => {
    mocks.account = null;
    render();
    vi.advanceTimersByTime(60_000);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.heartbeat).not.toHaveBeenCalled();
    expect(mocks.localProgress).toEqual([]);
  });

  test("keeps the heartbeat loop alive when the account is temporarily gone", () => {
    render({ currentTimeMs: 0 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(reportedTypes()).toEqual([1, 0]);

    mocks.account = null;
    render({ currentTimeMs: 0 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(reportedTypes()).toEqual([1, 0]);

    mocks.account = { mid: "123", generation: 1 };
    render({ currentTimeMs: 0 });
    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(reportedTypes()).toEqual([1, 0, 0]);
  });

  test.each([
    ["missing aid", { aid: undefined }],
    ["unknown duration", { durationSeconds: 0 }],
    ["missing cid", { cid: 0 }],
  ])("does not report with %s", (_name, patch) => {
    render(patch);
    vi.advanceTimersByTime(60_000);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.heartbeat).not.toHaveBeenCalled();
    expect(mocks.localProgress).toEqual([]);
  });

  test("keeps playing state when the same page is re-rendered twice", () => {
    render({ currentTimeMs: 30_000 });
    render({ currentTimeMs: 31_000 });
    expect(reportedTypes()).toEqual([1]);
    expect(mocks.start).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(PLAY_HEARTBEAT_INTERVAL_MS);
    expect(reportedTypes()).toEqual([1, 0]);
  });
});
