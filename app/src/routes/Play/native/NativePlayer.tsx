import { NetInfoStateType, useNetInfo } from "@react-native-community/netinfo";
import { type RouteProp, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useEventListener } from "expo";
import * as KeepAwake from "expo-keep-awake";
import { useVideoPlayer, VideoView } from "expo-video";
import type { VideoPlayer, VideoPlayerStatus } from "expo-video";
import React from "react";
import {
  Alert,
  Animated,
  AppState,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

import { getDanmakuSegmentIndex, invalidateDanmakuSegment } from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";
import { usePlayResumePosition } from "@/api/play-resume";
import { useVideoPlayUrl } from "@/api/play-url";
import { DANMAKU_SEND_STYLE, DanmakuLoginRequiredError } from "@/api/send-danmaku";
import { useSendDanmaku } from "@/api/useSendDanmaku";
import { useVideoInfo } from "@/api/video-info";
import { Icon } from "@/components/styled/rneui";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { lockAppPortrait, setFullscreenOrientationOwner } from "@/hooks/useAppOrientation";
import { useAppStateChange } from "@/hooks/useAppState";
import { usePartPlayProgressRecorder } from "@/hooks/usePartPlayProgressRecorder";
import { usePlayHeartbeatReporter } from "@/hooks/usePlayHeartbeatReporter";
import { useStore } from "@/store";
import { usePartPlayProgressPosition } from "@/store/part-play-progress";
import type { NavigationProps, RootStackParamList } from "@/types";
import { showToast } from "@/utils";
import { unlockOrientation } from "@/utils/screen-orientation";

import DanmakuComposer from "./DanmakuComposer";
import DanmakuOverlay from "./DanmakuOverlay";
import PlayerControls from "./PlayerControls";
import PlayerCover from "./PlayerCover";
import PlayerError from "./PlayerError";
import PlayerPoster from "./PlayerPoster";
import PlayerSeekHint from "./PlayerSeekHint";
import type { PlaybackMode, PlayEndedEvent } from "../playback-mode";
import {
  createVideoSource,
  isSeekJump,
  PLAYER_FAST_RATE,
  PLAYER_HEIGHT_ANIMATION_MS,
  PLAYER_SEEK_HINT_HOLD_MS,
  type PlayerSwipeDirection,
  resolveInlinePlayerHeight,
  resolveInitialResumeSnapshot,
  resolvePlayerResumeDecision,
  resolvePlaybackFailover,
  resolvePreferredQuality,
  resolveSeekTargetMs,
  shouldShowResumeButton,
  shouldRestartPlayback,
  type InitialResumeSnapshot,
} from "./player-helpers";
import {
  configureBackgroundPlayback,
  resolvePlayerSynchronization,
  type BackgroundPlaybackConfigurationResult,
} from "./player-lifecycle";
import { usePlayerControlsVisibility } from "./usePlayerControlsVisibility";
import { usePlayerGestures } from "./usePlayerGestures";
import { usePlayerPausedUi } from "./usePlayerPausedUi";

// Animated.View 需要额外包一层才能识别 className
const StyledAnimatedView = withUniwind(Animated.View) as unknown as React.ComponentType<
  React.ComponentProps<typeof Animated.View> & { className?: string }
>;

type NativePlayerProps = {
  currentPage: number;
  onPlayEnded: (event: PlayEndedEvent) => void;
  playbackMode: PlaybackMode;
  showAutoNext: boolean;
  onToggleAutoNext: () => void;
  onToggleLoop: () => void;
  fullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
};

export default function NativePlayer(props: NativePlayerProps) {
  const { currentPage, onPlayEnded, playbackMode, fullscreen, onFullscreenChange } = props;
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const isFocused = useIsFocused();
  const netInfo = useNetInfo();
  const { width, height } = useWindowDimensions();
  const {
    imagesList,
    $danmakuEnabled,
    set$danmakuEnabled,
    $backgroundPlayEnabled,
    set$backgroundPlayEnabled,
  } = useStore();
  const { account } = useBilibiliSessionState();
  const { logout } = useBilibiliSessionActions();
  const { data } = useVideoInfo(route.params.bvid);
  const videoInfo = { ...route.params, ...data };
  const pageInfo = videoInfo.pages?.[currentPage - 1];
  const cid = pageInfo?.cid ?? videoInfo.cid ?? 0;
  const durationSeconds = pageInfo?.duration ?? videoInfo.duration ?? 0;
  // 会话未就绪或已失效时不展示发送弹幕入口，其余播放控件不受影响
  const danmakuAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const danmakuVideo = videoInfo.aid ? { aid: String(videoInfo.aid), bvid: videoInfo.bvid } : null;
  const { send: sendDanmaku, isSending } = useSendDanmaku(danmakuAccount, danmakuVideo, cid);

  const isCellular = netInfo.type === NetInfoStateType.cellular;
  const networkReady = netInfo.type !== null && netInfo.type !== undefined;
  const [highQuality, setHighQuality] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  // 视频首帧是否已经渲染到播放器上，未渲染前用封面盖住画面
  const [firstFrameRendered, setFirstFrameRendered] = React.useState(false);
  // 播放是否真正开始过（收到过 playing=true），用于避免首帧渲染早于 playingChange 时续播按钮闪一下
  const [playbackStarted, setPlaybackStarted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playerStatus, setPlayerStatus] = React.useState<VideoPlayerStatus>("idle");
  const [fastRate, setFastRate] = React.useState(false);
  const [playerError, setPlayerError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [currentTimeMs, setCurrentTimeMs] = React.useState(0);
  // 弹幕从这一刻开始渲染，跳转、续播、开关弹幕时重新定位
  const [danmakuAnchorMs, setDanmakuAnchorMs] = React.useState(0);
  // 左右滑动调整进度时的目标进度与方向提示
  const [seekHint, setSeekHint] = React.useState<{
    targetMs: number;
    deltaSeconds: number;
  } | null>(null);
  // 竖屏视频下滑展开，高度由屏幕高度的 33% 切换到 70%
  const [portraitExpanded, setPortraitExpanded] = React.useState(false);
  // 弹幕输入条是否展开
  const [danmakuComposerOpen, setDanmakuComposerOpen] = React.useState(false);
  // 自己刚发送的弹幕，本地立即回显
  const [localDanmaku, setLocalDanmaku] = React.useState<DanmakuItem[]>([]);
  // 打开输入条前是否在播放，发送或取消后据此恢复
  const resumeAfterDanmakuRef = React.useRef(false);
  // 当前使用的播放地址（主地址 + 备用 CDN 镜像）与自动兜底的进度
  const [playbackAttempt, setPlaybackAttempt] = React.useState({
    index: 0,
    refreshCount: 0,
    token: 0,
  });
  const lastTimeRef = React.useRef(0);
  const nativePlayingRef = React.useRef(false);
  const pausedByImagesRef = React.useRef(false);
  // 左右滑动提示浮层的隐藏计时器
  const seekHintTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // 已经处理过的失败尝试，避免同一轮重复触发兜底
  const handledAttemptTokenRef = React.useRef(-1);
  // 已经为新地址补过重载的尝试
  const reloadedAttemptTokenRef = React.useRef(0);
  // 切换地址后需要恢复的播放进度（毫秒）
  const resumePositionMsRef = React.useRef(0);
  // 已经按 B站记录跳转过的分P，避免每次就绪都重复跳转
  const initialResumeHandledRef = React.useRef("");
  // App 在后台时不创建新的播放 service；需要自动播放或 CDN 兜底时等回到前台处理
  const pendingAutoplayRef = React.useRef(false);
  const pendingPlaybackErrorRef = React.useRef<{ token: number; message: string } | null>(null);
  const backgroundConfigurationRef = React.useRef<{
    player: VideoPlayer;
    enabled: boolean;
  } | null>(null);

  // 真正处于暂停态：起播、seek、缓冲造成的短暂暂停不算，避免暂停态的 UI 闪一下
  const pausedUiVisible = usePlayerPausedUi(isPlaying, playerStatus === "loading");
  // 控件显隐跟随稳定的播放状态：播放真正开始前保持显示，之后缓冲也不会把控件弹回来
  const controlsPlaying = playbackStarted && !pausedUiVisible;
  const { controlsVisible, toggleControls, keepControlsVisible, hideControls } =
    usePlayerControlsVisibility(controlsPlaying);

  const qn = resolvePreferredQuality(isCellular, highQuality);
  const { urls, error: playUrlError, retry } = useVideoPlayUrl(videoInfo.bvid, cid, qn);
  const uri = urls[Math.min(playbackAttempt.index, urls.length - 1)];
  // 后台播放的系统通知标题。取路由参数里的标题，保证渲染期稳定，避免重建播放器
  const notificationTitle = route.params.title || videoInfo.bvid;
  const source = uri ? createVideoSource(uri, notificationTitle) : null;

  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
    instance.loop = playbackMode.loop;
  });

  // 本地按分P 记录的位置优先；当前分P 没有本地记录时再回退 B站记录。
  const liveLocalPlayResumePositionMs = usePartPlayProgressPosition(videoInfo.bvid, cid);
  const initialResumeKey = `${videoInfo.bvid}:${cid}`;
  const initialLocalResumeRef = React.useRef<InitialResumeSnapshot>({
    key: "",
    positionMs: null,
  });
  initialLocalResumeRef.current = resolveInitialResumeSnapshot(
    initialLocalResumeRef.current,
    initialResumeKey,
    liveLocalPlayResumePositionMs,
  );
  const serverPlayResumePositionMs = usePlayResumePosition(videoInfo.aid, cid);
  const playResumePositionMs =
    initialLocalResumeRef.current.positionMs ?? serverPlayResumePositionMs;

  // 登录后按 B站网页播放器的方式上报播放进度，写入观看历史
  const { reportEnded } = usePlayHeartbeatReporter({
    bvid: videoInfo.bvid,
    aid: videoInfo.aid,
    cid,
    page: currentPage,
    durationSeconds,
    quality: qn,
    isPlaying,
    currentTimeMs,
  });
  const { reportEnded: reportPartProgressEnded } = usePartPlayProgressRecorder({
    bvid: videoInfo.bvid,
    cid,
    currentTimeMs,
    durationMs: durationSeconds * 1000,
    isPlaying,
  });
  const activePlayerRef = React.useRef({ player, cid, page: currentPage, hasPlayed: false });
  const previousActivePlayer = activePlayerRef.current;
  activePlayerRef.current = {
    player,
    cid,
    page: currentPage,
    hasPlayed:
      previousActivePlayer.player === player &&
      previousActivePlayer.cid === cid &&
      previousActivePlayer.page === currentPage
        ? previousActivePlayer.hasPlayed
        : false,
  };
  const playEndGuardRef = React.useRef({ player, handled: false });
  const onPlayEndedRef = React.useRef(onPlayEnded);
  onPlayEndedRef.current = onPlayEnded;
  const reportHeartbeatEndedRef = React.useRef(reportEnded);
  reportHeartbeatEndedRef.current = reportEnded;
  const reportPartProgressEndedRef = React.useRef(reportPartProgressEnded);
  reportPartProgressEndedRef.current = reportPartProgressEnded;

  function updatePlayingState(playing: boolean, synchronizeKeepAwake = false) {
    const changed = nativePlayingRef.current !== playing;
    nativePlayingRef.current = playing;
    setIsPlaying(playing);
    if (playing) {
      if (activePlayerRef.current.player === player) {
        activePlayerRef.current.hasPlayed = true;
      }
      // 真正开始播放后，本分 P 不再接受任何迟到的“初始续播”位置。
      initialResumeHandledRef.current = initialResumeKey;
      setPlaybackStarted(true);
      if ((changed || synchronizeKeepAwake) && AppState.currentState === "active") {
        void KeepAwake.activateKeepAwakeAsync("PLAY");
      }
      return;
    }
    if (changed || synchronizeKeepAwake) {
      KeepAwake.deactivateKeepAwake("PLAY");
    }
  }

  function synchronizePlayerFromNative(resetDanmaku: boolean) {
    const snapshot = resolvePlayerSynchronization(player, resetDanmaku);
    setPlayerStatus(snapshot.status);
    setCurrentTimeMs(snapshot.currentTimeMs);
    lastTimeRef.current = snapshot.currentTimeMs;
    if (snapshot.danmakuAnchorMs !== null) {
      // 后台期间的旧弹幕不补画，从当前媒体时间继续消费。
      setDanmakuAnchorMs(snapshot.danmakuAnchorMs);
    }
    updatePlayingState(snapshot.isPlaying, true);
  }

  function configureCurrentPlayerBackgroundPlayback(
    force = false,
  ): BackgroundPlaybackConfigurationResult {
    const previous = backgroundConfigurationRef.current;
    if (!force && previous?.player === player && previous.enabled === $backgroundPlayEnabled) {
      return "applied";
    }
    const result = configureBackgroundPlayback(
      player,
      $backgroundPlayEnabled,
      AppState.currentState,
    );
    if (result !== "deferred") {
      // 失败时也避免每次 timeUpdate 重渲染都重试；下一次回到前台会强制重试。
      backgroundConfigurationRef.current = { player, enabled: $backgroundPlayEnabled };
    }
    if (__DEV__ && result === "failed") {
      // oxlint-disable-next-line no-console
      console.warn("background playback service configuration was rejected");
    }
    return result;
  }

  /**
   * 播放器就绪后消费一次初始续播位置。已经开始播放或进度离开起点后，
   * 即使服务端结果或 15 秒本地落盘迟到，也不会再次 seek。
   */
  function applyPendingResumeIfReady() {
    const decision = resolvePlayerResumeDecision({
      handled: initialResumeHandledRef.current === initialResumeKey,
      positionMs: playResumePositionMs,
      failoverPositionMs: resumePositionMsRef.current,
      currentTimeMs: Math.max(0, Math.round(player.currentTime * 1000) || lastTimeRef.current),
      ready: player.status === "readyToPlay",
      hasPlayed: activePlayerRef.current.hasPlayed,
    });
    if (decision.type === "wait") {
      return;
    }
    initialResumeHandledRef.current = initialResumeKey;
    if (decision.type === "apply") {
      if (decision.origin === "failover") {
        resumePositionMsRef.current = 0;
      }
      applyResumePosition(decision.positionMs);
    }
  }

  React.useEffect(() => {
    applyPendingResumeIfReady();
  }, [playResumePositionMs, cid, videoInfo.bvid]);

  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    updatePlayingState(playing);
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    const next = Math.max(0, Math.round(currentTime * 1000));
    if (
      playbackMode.loop &&
      next < lastTimeRef.current &&
      playEndGuardRef.current.player === player
    ) {
      playEndGuardRef.current.handled = false;
    }
    if (isSeekJump(lastTimeRef.current, next)) {
      setDanmakuAnchorMs(next);
    }
    lastTimeRef.current = next;
    setCurrentTimeMs(next);
    // 前后台切换时 playingChange 可能丢失；原生只读属性作为最终事实来源。
    updatePlayingState(player.playing);
  });

  function recoverFromPlaybackError(message: string) {
    if (handledAttemptTokenRef.current === playbackAttempt.token) {
      return;
    }
    handledAttemptTokenRef.current = playbackAttempt.token;
    const failover = resolvePlaybackFailover({
      index: playbackAttempt.index,
      total: urls.length,
      refreshCount: playbackAttempt.refreshCount,
    });
    if (failover.type === "give-up") {
      setPlayerError(message);
      return;
    }
    // 自动兜底时记住当前进度，等新地址就绪后接着播
    resumePositionMsRef.current = Math.round(player.currentTime * 1000) || lastTimeRef.current;
    if (__DEV__) {
      // oxlint-disable-next-line no-console
      console.log("playback failover", {
        action: failover.type,
        index: playbackAttempt.index,
        total: urls.length,
        refreshCount: playbackAttempt.refreshCount,
        uri: uri?.slice(0, 90),
      });
    }
    if (failover.type === "next-url") {
      setPlaybackAttempt((current) => ({
        index: failover.index,
        refreshCount: current.refreshCount,
        token: current.token + 1,
      }));
      return;
    }
    setPlaybackAttempt((current) => ({
      index: 0,
      refreshCount: failover.refreshCount,
      token: current.token + 1,
    }));
    void retry().catch(() => {
      setPlayerError(message);
    });
  }

  useEventListener(player, "statusChange", ({ status, error }) => {
    setPlayerStatus(status);
    if (status === "readyToPlay") {
      setPlayerError(null);
      applyPendingResumeIfReady();
      return;
    }
    if (status !== "error") {
      return;
    }
    const message = error?.message ?? "视频播放失败";
    if (AppState.currentState !== "active") {
      pendingPlaybackErrorRef.current = { token: playbackAttempt.token, message };
      return;
    }
    recoverFromPlaybackError(message);
  });

  const appState = useAppStateChange((state) => {
    if (state !== "active") {
      if (!$backgroundPlayEnabled) {
        player.pause();
      }
      return;
    }

    // service 只能在前台创建；已在后台持续播放的同一播放器会复用现有 service。
    configureCurrentPlayerBackgroundPlayback(true);
    synchronizePlayerFromNative(true);

    const pendingError = pendingPlaybackErrorRef.current;
    pendingPlaybackErrorRef.current = null;
    if (pendingError && pendingError.token === playbackAttempt.token && player.status === "error") {
      recoverFromPlaybackError(pendingError.message);
      return;
    }

    if (
      pendingAutoplayRef.current &&
      started &&
      uri &&
      isFocused &&
      AppState.currentState === "active"
    ) {
      pendingAutoplayRef.current = false;
      player.play();
    }
  });

  React.useEffect(() => {
    if (!uri) {
      return;
    }
    const endedPlayer = player;
    const endedCid = cid;
    const endedPage = currentPage;
    playEndGuardRef.current = { player: endedPlayer, handled: false };
    const subscription = endedPlayer.addListener("playToEnd", () => {
      const active = activePlayerRef.current;
      if (
        playEndGuardRef.current.player !== endedPlayer ||
        playEndGuardRef.current.handled ||
        active.player !== endedPlayer ||
        active.cid !== endedCid ||
        active.page !== endedPage ||
        !active.hasPlayed
      ) {
        return;
      }
      playEndGuardRef.current.handled = true;
      // 部分设备播放结束后不会再派发 playingChange，这里主动收敛播放状态。
      reportHeartbeatEndedRef.current({ bvid: videoInfo.bvid, cid: endedCid });
      reportPartProgressEndedRef.current(videoInfo.bvid, endedCid);
      updatePlayingState(false);
      setPortraitExpanded(false);
      onPlayEndedRef.current({ cid: endedCid, page: endedPage });
    });
    return () => {
      subscription.remove();
    };
  }, [cid, currentPage, player, uri, videoInfo.bvid]);

  // 切换分P/清晰度时重置兜底状态与续播进度
  React.useEffect(() => {
    handledAttemptTokenRef.current = -1;
    pendingPlaybackErrorRef.current = null;
    resumePositionMsRef.current = 0;
    lastTimeRef.current = 0;
    setPortraitExpanded(false);
    setPlaybackAttempt((current) => ({ index: 0, refreshCount: 0, token: current.token + 1 }));
  }, [cid, qn]);

  // 切分P时收起弹幕输入条并清空本地回显
  React.useEffect(() => {
    // 先清掉上一P 的运行时位置，避免新播放器尚未回报时间时把旧位置写到新 cid。
    setCurrentTimeMs(0);
    nativePlayingRef.current = false;
    setIsPlaying(false);
    setPlaybackStarted(false);
    setDanmakuComposerOpen(false);
    setLocalDanmaku([]);
    setDanmakuAnchorMs(0);
  }, [cid]);

  // 进出全屏会改变屏幕方向与键盘状态，先收起输入条
  React.useEffect(() => {
    if (fullscreen) {
      setDanmakuComposerOpen(false);
    }
  }, [fullscreen]);

  // 播放地址变化后需要重新等待首帧，等待期间继续展示封面
  React.useEffect(() => {
    setFirstFrameRendered(false);
  }, [uri, playbackAttempt.token]);

  // 重新获取地址后如果和上一次完全相同，useVideoPlayer 不会重建播放器，这里补一次重载
  React.useEffect(() => {
    if (!source || reloadedAttemptTokenRef.current === playbackAttempt.token) {
      return;
    }
    if (AppState.currentState !== "active") {
      return;
    }
    reloadedAttemptTokenRef.current = playbackAttempt.token;
    if (player.status === "error") {
      void player.replaceAsync(source);
    }
  }, [playbackAttempt.token, player, source]);

  // 非流量环境下自动开播；流量环境需要点击封面
  React.useEffect(() => {
    if (!networkReady || isCellular || !uri) {
      return;
    }
    setStarted(true);
  }, [networkReady, isCellular, uri]);

  React.useEffect(() => {
    if (!started || !uri) {
      return;
    }
    if (AppState.currentState !== "active") {
      pendingAutoplayRef.current = true;
      return;
    }
    pendingAutoplayRef.current = false;
    const configuration = configureCurrentPlayerBackgroundPlayback();
    if (configuration === "deferred" || AppState.currentState !== "active") {
      pendingAutoplayRef.current = true;
      return;
    }
    player.play();
  }, [started, uri, player]);

  React.useEffect(() => {
    if (appState !== "active" || AppState.currentState !== "active") {
      return;
    }
    configureCurrentPlayerBackgroundPlayback();
  }, [appState, player, $backgroundPlayEnabled]);

  React.useEffect(() => {
    player.loop = playbackMode.loop;
  }, [playbackMode.loop, player]);

  // 离开播放页暂停，回到页面后由用户手动继续
  React.useEffect(() => {
    if (!isFocused) {
      pendingAutoplayRef.current = false;
      player.pause();
    }
  }, [isFocused, player]);

  // 查看图片时暂停，关闭图片后恢复
  React.useEffect(() => {
    if (imagesList.length > 0) {
      if (player.playing) {
        pausedByImagesRef.current = true;
        player.pause();
      }
      return;
    }
    if (pausedByImagesRef.current) {
      pausedByImagesRef.current = false;
      if (AppState.currentState !== "active") {
        pendingAutoplayRef.current = true;
        return;
      }
      player.play();
    }
  }, [imagesList.length, player]);

  React.useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    if (!fullscreen) {
      lockAppPortrait();
      return;
    }
    setFullscreenOrientationOwner(true);
    unlockOrientation();
    return () => {
      setFullscreenOrientationOwner(false);
      lockAppPortrait();
    };
  }, [fullscreen]);

  React.useEffect(() => {
    return () => {
      KeepAwake.deactivateKeepAwake("PLAY");
      if (seekHintTimerRef.current !== null) {
        clearTimeout(seekHintTimerRef.current);
      }
    };
  }, []);

  function handleSeek(timeMs: number) {
    player.currentTime = timeMs / 1000;
    lastTimeRef.current = Math.round(timeMs);
    setCurrentTimeMs(Math.round(timeMs));
    setDanmakuAnchorMs(Math.round(timeMs));
  }

  /** 播放器就绪后跳到指定进度（毫秒），并同步控件与弹幕状态 */
  function applyResumePosition(positionMs: number) {
    player.currentTime = positionMs / 1000;
    lastTimeRef.current = positionMs;
    setCurrentTimeMs(positionMs);
    setDanmakuAnchorMs(positionMs);
  }

  function handleSingleTap() {
    toggleControls();
  }

  /**
   * 播放总时长（毫秒）：优先用播放器实际时长，拿不到时退回视频信息
   */
  function resolvePlaybackDurationMs() {
    const playerDurationMs = Math.round(player.duration * 1000);
    if (Number.isFinite(playerDurationMs) && playerDurationMs > 0) {
      return playerDurationMs;
    }
    return Math.round(durationSeconds * 1000);
  }

  /**
   * 点击继续播放：先隐藏控件，避免暂停态强制显示后再等 3 秒自动隐藏。
   * 播放到结尾后 expo-video 的 play() 不会有任何反应，需要先回到开头
   */
  function resumePlayback() {
    hideControls();
    if (
      shouldRestartPlayback({
        currentMs: Math.round(player.currentTime * 1000),
        durationMs: resolvePlaybackDurationMs(),
      })
    ) {
      if (playEndGuardRef.current.player === player) {
        playEndGuardRef.current.handled = false;
      }
      handleSeek(0);
    }
    player.play();
  }

  /**
   * 播放/暂停按钮：以播放器的实时状态判断，避免 React 状态滞后导致点击没反应
   */
  function handleTogglePlay() {
    if (player.playing) {
      player.pause();
      return;
    }
    resumePlayback();
  }

  /**
   * 打开弹幕输入条：暂停播放并记住原来的播放状态
   */
  function openDanmakuComposer() {
    resumeAfterDanmakuRef.current = player.playing;
    player.pause();
    keepControlsVisible();
    setDanmakuComposerOpen(true);
  }

  /**
   * 关闭输入条后恢复打开前的播放状态，避免用户手动再点一次播放
   */
  function resumeDanmakuPlayback() {
    if (!resumeAfterDanmakuRef.current) {
      return;
    }
    resumeAfterDanmakuRef.current = false;
    player.play();
  }

  function closeDanmakuComposer() {
    setDanmakuComposerOpen(false);
    Keyboard.dismiss();
    resumeDanmakuPlayback();
  }

  function handleDanmakuLoginRequired(error: Error) {
    Alert.alert("请重新登录 B站", error.message, [
      { text: "取消", style: "cancel" },
      {
        text: "重新登录",
        onPress: () => {
          if (!isFocused) return;
          void logout()
            .then(() => navigation.navigate("MainTabs", { screen: "Followings" }))
            .catch(() => showToast("退出登录失败，请在设置页重试"));
        },
      },
    ]);
  }

  /**
   * 发送弹幕：成功后本地回显并恢复播放，失败保留输入内容并提示原因
   */
  async function submitDanmaku(text: string) {
    const progressMs = Math.round(player.currentTime * 1000);
    try {
      const sent = await sendDanmaku(text, progressMs);
      setLocalDanmaku((current) => [
        ...current,
        {
          progressMs: sent.progressMs,
          content: sent.text,
          color: Number(DANMAKU_SEND_STYLE.color),
          fontsize: Number(DANMAKU_SEND_STYLE.fontsize),
        },
      ]);
      // 分段缓存失效后，再次拉取该分段能拿到这条新弹幕
      invalidateDanmakuSegment(cid, getDanmakuSegmentIndex(sent.progressMs));
      setDanmakuComposerOpen(false);
      Keyboard.dismiss();
      resumeDanmakuPlayback();
      showToast("弹幕已发送");
      return true;
    } catch (error) {
      if (error instanceof DanmakuLoginRequiredError) {
        handleDanmakuLoginRequired(error);
        return false;
      }
      showToast(error instanceof Error ? error.message : "弹幕发送失败，请稍后重试");
      return false;
    }
  }

  function clearSeekHint() {
    if (seekHintTimerRef.current !== null) {
      clearTimeout(seekHintTimerRef.current);
      seekHintTimerRef.current = null;
    }
    setSeekHint(null);
  }

  function resolveSeekTarget(deltaSeconds: number) {
    return resolveSeekTargetMs({
      currentMs: currentTimeMs,
      deltaMs: deltaSeconds * 1000,
      durationMs: durationSeconds * 1000,
    });
  }

  /**
   * 左右滑动过程中预览调整后的进度，滑动距离不足时收起提示
   */
  function handleSeekSwipePreview(deltaSeconds: number) {
    if (!started || showError || deltaSeconds === 0) {
      clearSeekHint();
      return;
    }
    setSeekHint({ targetMs: resolveSeekTarget(deltaSeconds), deltaSeconds });
  }

  /**
   * 左右滑动结束时调整进度，提示浮层短暂停留后收起
   */
  function handleSeekSwipeCommit(deltaSeconds: number) {
    if (!started || showError || deltaSeconds === 0) {
      return;
    }
    const targetMs = resolveSeekTarget(deltaSeconds);
    handleSeek(targetMs);
    setSeekHint({ targetMs, deltaSeconds });
    if (seekHintTimerRef.current !== null) {
      clearTimeout(seekHintTimerRef.current);
    }
    seekHintTimerRef.current = setTimeout(() => {
      seekHintTimerRef.current = null;
      setSeekHint(null);
    }, PLAYER_SEEK_HINT_HOLD_MS);
  }

  function handleLongPressStart() {
    player.playbackRate = PLAYER_FAST_RATE;
    setFastRate(true);
  }

  function handleLongPressEnd() {
    player.playbackRate = 1;
    setFastRate(false);
  }

  async function handleRetry() {
    if (isRetrying) {
      return;
    }
    setIsRetrying(true);
    setPlayerError(null);
    resumePositionMsRef.current = 0;
    try {
      await retry();
      handledAttemptTokenRef.current = -1;
      // 重置兜底进度并强制重新加载（地址没变时由 reloadedAttemptToken 的重载逻辑兜底）
      setPlaybackAttempt((current) => ({ index: 0, refreshCount: 0, token: current.token + 1 }));
    } catch {
      // 重试失败保留错误态
    }
    setIsRetrying(false);
  }

  const gesture = usePlayerGestures({
    onSingleTap: handleSingleTap,
    onDoubleTap: () => {
      player.pause();
    },
    onLongPressStart: handleLongPressStart,
    onLongPressEnd: handleLongPressEnd,
    onVerticalSwipe: handleVerticalSwipe,
    onSeekSwipePreview: handleSeekSwipePreview,
    onSeekSwipeCommit: handleSeekSwipeCommit,
    onSeekSwipeCancel: clearSeekHint,
  });

  let videoWidth = pageInfo?.width ?? videoInfo.width;
  let videoHeight = pageInfo?.height ?? videoInfo.height;
  if (!pageInfo && videoInfo.rotate && videoWidth && videoHeight) {
    const swap = videoWidth;
    videoWidth = videoHeight;
    videoHeight = swap;
  }
  const isPortraitVideo = Boolean(videoWidth && videoHeight && videoHeight > videoWidth);
  const inlineHeight = resolveInlinePlayerHeight({
    screenWidth: width,
    screenHeight: height,
    videoWidth,
    videoHeight,
    expanded: portraitExpanded,
  });
  const containerHeight = fullscreen ? height : inlineHeight;
  const hasError = Boolean(playerError) || (Boolean(playUrlError) && !uri);
  const showError = hasError || isRetrying;

  // 高度切换用动画过渡，全屏分支不使用该值
  const [inlineHeightAnim] = React.useState(() => new Animated.Value(inlineHeight));
  React.useEffect(() => {
    const animation = Animated.timing(inlineHeightAnim, {
      toValue: inlineHeight,
      duration: PLAYER_HEIGHT_ANIMATION_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [inlineHeight, inlineHeightAnim]);

  /**
   * 竖屏视频下滑展开到屏幕高度的 70%，上滑收回；
   * 横屏视频、全屏、未开播以及错误态下不响应
   */
  function handleVerticalSwipe(direction: PlayerSwipeDirection) {
    if (!started || !isPortraitVideo || fullscreen || showError) {
      return;
    }
    setPortraitExpanded(direction === "down");
  }

  return (
    <StyledAnimatedView
      renderToHardwareTextureAndroid
      className="relative w-full shrink-0 overflow-hidden bg-black"
      style={
        fullscreen
          ? { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }
          : { height: inlineHeightAnim }
      }
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="contain"
        allowsPictureInPicture={false}
        onFirstFrameRender={() => {
          setFirstFrameRendered(true);
        }}
      />
      {started && !firstFrameRendered ? (
        <PlayerPoster
          cover={videoInfo.cover}
          containerWidth={width}
          containerHeight={containerHeight}
          loading={!showError}
        />
      ) : null}
      {started ? (
        <DanmakuOverlay
          cid={cid}
          enabled={$danmakuEnabled}
          isPlaying={isPlaying}
          currentTimeMs={currentTimeMs}
          anchorTimeMs={danmakuAnchorMs}
          playbackRate={fastRate ? PLAYER_FAST_RATE : 1}
          width={width}
          height={containerHeight}
          fontSize={fullscreen ? 18 : 15}
          localItems={localDanmaku}
        />
      ) : null}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
      {fastRate ? (
        <View className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1">
          <Text className="text-xs font-bold text-white">{`${PLAYER_FAST_RATE}x`}</Text>
        </View>
      ) : null}
      {seekHint ? (
        <PlayerSeekHint targetMs={seekHint.targetMs} deltaSeconds={seekHint.deltaSeconds} />
      ) : null}
      {/* 首帧渲染前画面被封面盖住，此时不显示播放按钮，避免和封面叠在一起 */}
      {shouldShowResumeButton({
        started,
        firstFrameRendered,
        playbackStarted,
        paused: pausedUiVisible,
        hasError,
        overlayVisible: seekHint !== null || danmakuComposerOpen,
      }) ? (
        <View pointerEvents="box-none" className="absolute inset-0 items-center justify-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="继续播放"
            hitSlop={12}
            className="h-14 w-14 items-center justify-center rounded-full bg-black/40"
            onPress={resumePlayback}
          >
            <Icon name="play" type="material-design" size={34} color="#ffffff" />
          </Pressable>
        </View>
      ) : null}
      {started ? (
        <PlayerControls
          paused={pausedUiVisible}
          currentTimeMs={currentTimeMs}
          durationMs={durationSeconds * 1000}
          danmakuEnabled={$danmakuEnabled}
          canSendDanmaku={Boolean(danmakuAccount)}
          backgroundPlayEnabled={$backgroundPlayEnabled}
          loopEnabled={playbackMode.loop}
          autoNextEnabled={playbackMode.autoNext}
          showAutoNext={props.showAutoNext}
          fullscreen={fullscreen}
          visible={controlsVisible}
          onTogglePlay={handleTogglePlay}
          onToggleDanmaku={() => {
            set$danmakuEnabled(!$danmakuEnabled);
            setDanmakuAnchorMs(currentTimeMs);
          }}
          onSendDanmaku={openDanmakuComposer}
          onToggleBackgroundPlay={() => {
            const next = !$backgroundPlayEnabled;
            set$backgroundPlayEnabled(next);
            showToast(next ? "后台播放已开启" : "后台播放已关闭");
          }}
          onToggleLoop={props.onToggleLoop}
          onToggleAutoNext={props.onToggleAutoNext}
          onToggleFullscreen={() => {
            keepControlsVisible();
            onFullscreenChange(!fullscreen);
          }}
          onSeek={handleSeek}
          onInteraction={keepControlsVisible}
        />
      ) : (
        <PlayerCover
          cover={videoInfo.cover}
          containerWidth={width}
          containerHeight={containerHeight}
          duration={videoInfo.duration}
          isCellular={isCellular}
          highQuality={highQuality}
          onHighQualityChange={setHighQuality}
          onStart={() => {
            setStarted(true);
          }}
        />
      )}
      {showError ? (
        <PlayerError
          retrying={isRetrying}
          onRetry={() => {
            void handleRetry();
          }}
        />
      ) : null}
      {danmakuComposerOpen ? (
        <DanmakuComposer
          pending={isSending}
          onSubmit={submitDanmaku}
          onClose={closeDanmakuComposer}
        />
      ) : null}
    </StyledAnimatedView>
  );
}
