import React from "react";

import {
  createPlayHeartbeatSession,
  PLAY_HEARTBEAT_TYPES,
  playHeartbeatRequestDependencies,
  reportPlayHeartbeat,
  reportPlayStart,
} from "@/api/play-heartbeat";
import type {
  PlayHeartbeatAccount,
  PlayHeartbeatReport,
  PlayHeartbeatSession,
  PlayHeartbeatType,
  PlayHeartbeatVideo,
} from "@/api/play-heartbeat.types";
import type { VideoQuality } from "@/api/play-url";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { recordLocalWatchProgress } from "@/store/watch-progress";

/** 播放中的上报间隔，与 B站网页播放器一致 */
export const PLAY_HEARTBEAT_INTERVAL_MS = 15000;

export type PlayHeartbeatReporterProps = {
  bvid: string;
  aid?: string | number;
  cid: number;
  page: number;
  /** 当前分P 时长（秒），拿不到时不上报 */
  durationSeconds: number;
  quality: VideoQuality;
  isPlaying: boolean;
  currentTimeMs: number;
};

export type PlayHeartbeatEndTarget = Pick<PlayHeartbeatReporterProps, "bvid" | "cid">;

type MutableRef<T> = { current: T };

type PlayHeartbeatInput = {
  account: PlayHeartbeatAccount | null;
  props: PlayHeartbeatReporterProps;
};

/** 一次播放会话的完整状态；全部放在 ref 里，状态机按真实状态变化上报 */
type PlayHeartbeatState = {
  /** 会话对应的 `bvid:cid`，变化时重建 */
  key: string;
  session: PlayHeartbeatSession | null;
  /** 会话的报送信息快照，切换分P 后仍能按旧分P 收尾 */
  video: PlayHeartbeatVideo | null;
  quality: VideoQuality;
  durationSeconds: number;
  positionSeconds: number;
  playing: boolean;
  /** 本段开始播放的时间戳（毫秒），未播放时为 0 */
  playingSinceMs: number;
  /** 会话内累计播放时长（毫秒） */
  accumulatedMs: number;
};

type TickTimer = ReturnType<typeof setTimeout> | null;

function createIdleState(): PlayHeartbeatState {
  return {
    key: "",
    session: null,
    video: null,
    quality: 80,
    durationSeconds: 0,
    positionSeconds: 0,
    playing: false,
    playingSinceMs: 0,
    accumulatedMs: 0,
  };
}

/** 缺少 aid/cid/时长时无法上报，直接跳过 */
function resolveVideo(props: PlayHeartbeatReporterProps): PlayHeartbeatVideo | null {
  const bvid = props.bvid.trim();
  const aid = typeof props.aid === "number" ? String(props.aid) : (props.aid ?? "").trim();
  if (!bvid || !/^[1-9]\d*$/.test(aid) || !Number.isSafeInteger(props.cid) || props.cid <= 0) {
    return null;
  }
  return { aid, bvid, cid: props.cid, page: props.page };
}

/** 把还在播放的那一段时长计入累计值 */
function accumulatePlayingTime(state: PlayHeartbeatState, nowMs: number) {
  if (!state.playing || state.playingSinceMs <= 0) {
    return;
  }
  state.accumulatedMs += Math.max(0, nowMs - state.playingSinceMs);
  state.playingSinceMs = nowMs;
}

/** 会话内真实播放秒数：拖动进度条不会让它增加 */
function resolveRealPlayedSeconds(state: PlayHeartbeatState, nowMs: number) {
  const pending =
    state.playing && state.playingSinceMs > 0 ? Math.max(0, nowMs - state.playingSinceMs) : 0;
  return Math.floor((state.accumulatedMs + pending) / 1000);
}

/** 本地已知的进度比例：播完算满格，时长未知时按无进度处理 */
function resolveLocalProgressRatio(
  state: PlayHeartbeatState,
  ended: boolean,
  progressSeconds: number,
) {
  if (ended) {
    return 1;
  }
  if (state.durationSeconds <= 0) {
    return 0;
  }
  return Math.min(1, progressSeconds / state.durationSeconds);
}

function sendReport(
  state: PlayHeartbeatState,
  input: PlayHeartbeatInput,
  type: PlayHeartbeatType,
  nowMs: number,
) {
  const { account } = input;
  const { session, video } = state;
  if (!account || !session || !video) {
    return;
  }
  const ended = type === PLAY_HEARTBEAT_TYPES.end;
  // 播完时以完整时长作为进度，其余情况取当前位置
  const progressSeconds = ended ? state.durationSeconds : state.positionSeconds;
  // 本地先记一份进度：封面进度条不用等服务端写入历史，上报失败也照样展示
  const localProgressRatio = resolveLocalProgressRatio(state, ended, progressSeconds);
  if (localProgressRatio > 0) {
    recordLocalWatchProgress(video.bvid, localProgressRatio);
  }
  session.maxPlayedTime = Math.max(session.maxPlayedTime, progressSeconds);
  const report: PlayHeartbeatReport = {
    type,
    playedTime: ended ? -1 : progressSeconds,
    realPlayedTime: resolveRealPlayedSeconds(state, nowMs),
    videoDuration: state.durationSeconds,
    quality: state.quality,
  };
  // 上报失败不影响播放，静默丢弃
  void reportPlayHeartbeat(account, video, session, report, playHeartbeatRequestDependencies).catch(
    () => {},
  );
}

function clearTick(tickRef: MutableRef<TickTimer>) {
  if (tickRef.current === null) {
    return;
  }
  clearTimeout(tickRef.current);
  tickRef.current = null;
}

function scheduleTick(
  state: PlayHeartbeatState,
  inputRef: MutableRef<PlayHeartbeatInput>,
  tickRef: MutableRef<TickTimer>,
) {
  if (tickRef.current !== null) {
    return;
  }
  tickRef.current = setTimeout(function handlePlayHeartbeatTick() {
    tickRef.current = null;
    const input = inputRef.current;
    if (!state.session || !state.playing || !input.account) {
      return;
    }
    const nowMs = Date.now();
    sendReport(state, input, PLAY_HEARTBEAT_TYPES.periodic, nowMs);
    scheduleTick(state, inputRef, tickRef);
  }, PLAY_HEARTBEAT_INTERVAL_MS);
}

/** 开始播放：新建会话并上报开始播放与首个心跳 */
function startSession(state: PlayHeartbeatState, input: PlayHeartbeatInput, nowMs: number) {
  const { account, props } = input;
  const video = resolveVideo(props);
  if (!account || !video) {
    return;
  }
  const positionSeconds = Math.max(0, Math.round(props.currentTimeMs / 1000));
  state.key = `${props.bvid}:${props.cid}`;
  state.session = createPlayHeartbeatSession(nowMs, positionSeconds);
  state.video = video;
  state.quality = props.quality;
  state.durationSeconds = Math.max(0, Math.round(props.durationSeconds));
  state.positionSeconds = positionSeconds;
  state.playing = true;
  state.playingSinceMs = nowMs;
  state.accumulatedMs = 0;
  void reportPlayStart(account, video, state.session, playHeartbeatRequestDependencies).catch(
    () => {},
  );
  sendReport(state, input, PLAY_HEARTBEAT_TYPES.start, nowMs);
}

/**
 * 结束当前会话：`ended` 为 true 时上报“播放结束”（played_time=-1），
 * 否则按暂停上报，保证离开播放页时进度已经写入。
 */
function finishSession(
  state: PlayHeartbeatState,
  input: PlayHeartbeatInput,
  nowMs: number,
  ended: boolean,
) {
  if (!state.session) {
    return;
  }
  accumulatePlayingTime(state, nowMs);
  sendReport(state, input, ended ? PLAY_HEARTBEAT_TYPES.end : PLAY_HEARTBEAT_TYPES.pause, nowMs);
  state.key = "";
  state.session = null;
  state.video = null;
  state.playing = false;
  state.playingSinceMs = 0;
  state.accumulatedMs = 0;
}

/** 每次渲染后同步一次：只在播放状态真正变化时上报，可重复调用 */
export function syncPlayHeartbeat(
  state: PlayHeartbeatState,
  inputRef: MutableRef<PlayHeartbeatInput>,
  tickRef: MutableRef<TickTimer>,
  nowMs: number,
) {
  const input = inputRef.current;
  const { account, props } = input;
  const key = `${props.bvid}:${props.cid}`;
  const canReport = Boolean(account && resolveVideo(props) && props.durationSeconds > 0);

  // 换视频或换分P：旧会话按暂停收尾，新分P 由下面的分支重新建会话
  if (state.session && state.key !== key) {
    clearTick(tickRef);
    finishSession(state, input, nowMs, false);
  }

  if (!state.session) {
    if (!canReport || !props.isPlaying) {
      clearTick(tickRef);
      return;
    }
    startSession(state, input, nowMs);
    scheduleTick(state, inputRef, tickRef);
    return;
  }

  // 同一会话内刷新上报字段，拖动进度条不额外上报，由下一次心跳带上
  state.positionSeconds = Math.max(0, Math.round(props.currentTimeMs / 1000));
  state.durationSeconds = Math.max(0, Math.round(props.durationSeconds));
  state.quality = props.quality;

  if (props.isPlaying && !state.playing) {
    state.playing = true;
    state.playingSinceMs = nowMs;
    sendReport(state, input, PLAY_HEARTBEAT_TYPES.resume, nowMs);
  } else if (!props.isPlaying && state.playing) {
    accumulatePlayingTime(state, nowMs);
    state.playing = false;
    state.playingSinceMs = 0;
    sendReport(state, input, PLAY_HEARTBEAT_TYPES.pause, nowMs);
  }

  if (state.playing) {
    // 账号切换等情况会让心跳链中断，仍处于播放中时补回来
    scheduleTick(state, inputRef, tickRef);
  } else {
    clearTick(tickRef);
  }
}

/** 播放结束时上报“已看完”，随后清空会话，重新播放会开启新会话 */
export function endPlayHeartbeat(
  state: PlayHeartbeatState,
  inputRef: MutableRef<PlayHeartbeatInput>,
  tickRef: MutableRef<TickTimer>,
  nowMs: number,
) {
  clearTick(tickRef);
  finishSession(state, inputRef.current, nowMs, true);
}

/** 离开播放页时补报一次暂停，保证最后的位置被记录 */
export function flushPlayHeartbeat(
  state: PlayHeartbeatState,
  inputRef: MutableRef<PlayHeartbeatInput>,
  tickRef: MutableRef<TickTimer>,
  nowMs: number,
) {
  clearTick(tickRef);
  finishSession(state, inputRef.current, nowMs, false);
}

/**
 * 按 B站网页播放器的行为上报播放进度：
 * 开始播放、每 15 秒、暂停、继续、播放结束各上报一次，未登录或缺少视频信息时不上报。
 */
export function usePlayHeartbeatReporter(props: PlayHeartbeatReporterProps) {
  const { account } = useBilibiliSessionState();
  const activeAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const stateRef = React.useRef<PlayHeartbeatState>(createIdleState());
  const inputRef = React.useRef<PlayHeartbeatInput>({ account: activeAccount, props });
  const tickRef = React.useRef<TickTimer>(null);

  React.useEffect(() => {
    inputRef.current = { account: activeAccount, props };
    syncPlayHeartbeat(stateRef.current, inputRef, tickRef, Date.now());
  });

  React.useEffect(() => {
    return () => {
      flushPlayHeartbeat(stateRef.current, inputRef, tickRef, Date.now());
    };
  }, []);

  function reportEnded(target?: PlayHeartbeatEndTarget) {
    if (target && stateRef.current.key !== `${target.bvid}:${target.cid}`) {
      return;
    }
    endPlayHeartbeat(stateRef.current, inputRef, tickRef, Date.now());
  }

  return { reportEnded };
}
