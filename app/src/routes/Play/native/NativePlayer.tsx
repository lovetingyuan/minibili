import { NetInfoStateType, useNetInfo } from "@react-native-community/netinfo";
import { type RouteProp, useIsFocused, useRoute } from "@react-navigation/native";
import { useEventListener } from "expo";
import * as KeepAwake from "expo-keep-awake";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

import { useVideoPlayUrl } from "@/api/play-url";
import { useVideoInfo } from "@/api/video-info";
import { Icon } from "@/components/styled/rneui";
import { lockAppPortrait, setFullscreenOrientationOwner } from "@/hooks/useAppOrientation";
import { useAppStateChange } from "@/hooks/useAppState";
import { useStore } from "@/store";
import type { RootStackParamList } from "@/types";
import { unlockOrientation } from "@/utils/screen-orientation";

import DanmakuOverlay from "./DanmakuOverlay";
import PlayerControls from "./PlayerControls";
import PlayerCover from "./PlayerCover";
import PlayerError from "./PlayerError";
import PlayerPoster from "./PlayerPoster";
import PlayerSeekHint from "./PlayerSeekHint";
import {
  createVideoSource,
  isSeekJump,
  PLAYER_FAST_RATE,
  PLAYER_HEIGHT_ANIMATION_MS,
  PLAYER_SEEK_HINT_HOLD_MS,
  type PlayerSwipeDirection,
  resolveInlinePlayerHeight,
  resolvePlaybackFailover,
  resolvePreferredQuality,
  resolveSeekTargetMs,
  shouldRestartPlayback,
} from "./player-helpers";
import { usePlayerControlsVisibility } from "./usePlayerControlsVisibility";
import { usePlayerGestures } from "./usePlayerGestures";

// Animated.View 需要额外包一层才能识别 className
const StyledAnimatedView = withUniwind(Animated.View) as unknown as React.ComponentType<
  React.ComponentProps<typeof Animated.View> & { className?: string }
>;

type NativePlayerProps = {
  currentPage: number;
  onPlayEnded: () => void;
  fullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
};

export default function NativePlayer(props: NativePlayerProps) {
  const { currentPage, onPlayEnded, fullscreen, onFullscreenChange } = props;
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const isFocused = useIsFocused();
  const netInfo = useNetInfo();
  const { width, height } = useWindowDimensions();
  const { imagesList, $danmakuEnabled, set$danmakuEnabled, $backgroundPlayEnabled } = useStore();
  const { data } = useVideoInfo(route.params.bvid);
  const videoInfo = { ...route.params, ...data };
  const pageInfo = videoInfo.pages?.[currentPage - 1];
  const cid = pageInfo?.cid ?? videoInfo.cid ?? 0;
  const durationSeconds = pageInfo?.duration ?? videoInfo.duration ?? 0;

  const isCellular = netInfo.type === NetInfoStateType.cellular;
  const networkReady = netInfo.type !== null && netInfo.type !== undefined;
  const [highQuality, setHighQuality] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  // 视频首帧是否已经渲染到播放器上，未渲染前用封面盖住画面
  const [firstFrameRendered, setFirstFrameRendered] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [fastRate, setFastRate] = React.useState(false);
  const [playerError, setPlayerError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [currentTimeMs, setCurrentTimeMs] = React.useState(0);
  const [seekToken, setSeekToken] = React.useState(0);
  // 左右滑动调整进度时的目标进度与方向提示
  const [seekHint, setSeekHint] = React.useState<{
    targetMs: number;
    deltaSeconds: number;
  } | null>(null);
  // 竖屏视频下滑展开，高度由屏幕高度的 33% 切换到 70%
  const [portraitExpanded, setPortraitExpanded] = React.useState(false);
  // 当前使用的播放地址（主地址 + 备用 CDN 镜像）与自动兜底的进度
  const [playbackAttempt, setPlaybackAttempt] = React.useState({
    index: 0,
    refreshCount: 0,
    token: 0,
  });
  const lastTimeRef = React.useRef(0);
  const pausedByImagesRef = React.useRef(false);
  // 左右滑动提示浮层的隐藏计时器
  const seekHintTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // 已经处理过的失败尝试，避免同一轮重复触发兜底
  const handledAttemptTokenRef = React.useRef(-1);
  // 已经为新地址补过重载的尝试
  const reloadedAttemptTokenRef = React.useRef(0);
  // 切换地址后需要恢复的播放进度（毫秒）
  const resumePositionMsRef = React.useRef(0);

  const { controlsVisible, toggleControls, keepControlsVisible, hideControls } =
    usePlayerControlsVisibility(isPlaying);

  const qn = resolvePreferredQuality(isCellular, highQuality);
  const { urls, error: playUrlError, retry } = useVideoPlayUrl(videoInfo.bvid, cid, qn);
  const uri = urls[Math.min(playbackAttempt.index, urls.length - 1)];
  const source = uri ? createVideoSource(uri) : null;

  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
    instance.staysActiveInBackground = $backgroundPlayEnabled;
    instance.showNowPlayingNotification = $backgroundPlayEnabled;
  });

  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    setIsPlaying(playing);
    if (playing) {
      void KeepAwake.activateKeepAwakeAsync("PLAY");
    } else {
      KeepAwake.deactivateKeepAwake("PLAY");
    }
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    const next = Math.max(0, Math.round(currentTime * 1000));
    if (isSeekJump(lastTimeRef.current, next)) {
      setSeekToken((token) => token + 1);
    }
    lastTimeRef.current = next;
    setCurrentTimeMs(next);
  });

  useEventListener(player, "statusChange", ({ status, error }) => {
    if (status === "readyToPlay") {
      setPlayerError(null);
      const resumePositionMs = resumePositionMsRef.current;
      if (resumePositionMs > 0) {
        resumePositionMsRef.current = 0;
        player.currentTime = resumePositionMs / 1000;
        lastTimeRef.current = resumePositionMs;
        setCurrentTimeMs(resumePositionMs);
        setSeekToken((token) => token + 1);
      }
      return;
    }
    if (status !== "error" || handledAttemptTokenRef.current === playbackAttempt.token) {
      return;
    }
    handledAttemptTokenRef.current = playbackAttempt.token;
    const failover = resolvePlaybackFailover({
      index: playbackAttempt.index,
      total: urls.length,
      refreshCount: playbackAttempt.refreshCount,
    });
    if (failover.type === "give-up") {
      setPlayerError(error?.message ?? "视频播放失败");
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
      setPlayerError(error?.message ?? "视频播放失败");
    });
  });

  useEventListener(player, "playToEnd", () => {
    // 部分设备播放结束后不会再派发 playingChange，这里主动收敛播放状态，
    // 保证播放按钮能切回“播放”，点击时可以重新播放
    setIsPlaying(false);
    KeepAwake.deactivateKeepAwake("PLAY");
    setPortraitExpanded(false);
    onPlayEnded();
  });

  // 切换分P/清晰度时重置兜底状态与续播进度
  React.useEffect(() => {
    handledAttemptTokenRef.current = -1;
    resumePositionMsRef.current = 0;
    lastTimeRef.current = 0;
    setPortraitExpanded(false);
    setPlaybackAttempt((current) => ({ index: 0, refreshCount: 0, token: current.token + 1 }));
  }, [cid, qn]);

  // 播放地址变化后需要重新等待首帧，等待期间继续展示封面
  React.useEffect(() => {
    setFirstFrameRendered(false);
  }, [uri, playbackAttempt.token]);

  // 重新获取地址后如果和上一次完全相同，useVideoPlayer 不会重建播放器，这里补一次重载
  React.useEffect(() => {
    if (!source || reloadedAttemptTokenRef.current === playbackAttempt.token) {
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
    player.play();
  }, [started, uri, player]);

  React.useEffect(() => {
    player.staysActiveInBackground = $backgroundPlayEnabled;
    player.showNowPlayingNotification = $backgroundPlayEnabled;
  }, [player, $backgroundPlayEnabled]);

  // 离开播放页暂停，回到页面后由用户手动继续
  React.useEffect(() => {
    if (!isFocused) {
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
      player.play();
    }
  }, [imagesList.length, player]);

  useAppStateChange((state) => {
    if (state === "active" || $backgroundPlayEnabled) {
      return;
    }
    player.pause();
  });

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
    setSeekToken((token) => token + 1);
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
        />
      ) : null}
      {started ? (
        <DanmakuOverlay
          cid={cid}
          durationSeconds={durationSeconds}
          enabled={$danmakuEnabled}
          isPlaying={isPlaying}
          currentTimeMs={currentTimeMs}
          seekToken={seekToken}
          width={width}
          height={containerHeight}
          fontSize={fullscreen ? 18 : 15}
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
      {started && firstFrameRendered && !isPlaying && !hasError && !seekHint ? (
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
          isPlaying={isPlaying}
          currentTimeMs={currentTimeMs}
          durationMs={durationSeconds * 1000}
          danmakuEnabled={$danmakuEnabled}
          fullscreen={fullscreen}
          visible={controlsVisible}
          onTogglePlay={handleTogglePlay}
          onToggleDanmaku={() => {
            set$danmakuEnabled(!$danmakuEnabled);
          }}
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
          onToggleHighQuality={() => {
            setHighQuality((value) => !value);
          }}
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
    </StyledAnimatedView>
  );
}
