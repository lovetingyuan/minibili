import { NetInfoStateType, useNetInfo } from "@react-native-community/netinfo";
import { type RouteProp, useIsFocused, useRoute } from "@react-navigation/native";
import { useEventListener } from "expo";
import * as KeepAwake from "expo-keep-awake";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { useVideoPlayUrl } from "@/api/play-url";
import { useVideoInfo } from "@/api/video-info";
import { Icon } from "@/components/styled/rneui";
import { UA } from "@/constants";
import { lockAppPortrait, setFullscreenOrientationOwner } from "@/hooks/useAppOrientation";
import { useAppStateChange } from "@/hooks/useAppState";
import { useStore } from "@/store";
import type { RootStackParamList } from "@/types";
import { unlockOrientation } from "@/utils/screen-orientation";

import DanmakuOverlay from "./DanmakuOverlay";
import PlayerControls from "./PlayerControls";
import PlayerCover from "./PlayerCover";
import PlayerError from "./PlayerError";
import {
  isSeekJump,
  PLAYER_FAST_RATE,
  resolveInlinePlayerHeight,
  resolvePreferredQuality,
  resolveTapAction,
} from "./player-helpers";
import { usePlayerGestures } from "./usePlayerGestures";

const PLAY_URL_REFERER = "https://www.bilibili.com";

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
  const {
    imagesList,
    $danmakuEnabled,
    set$danmakuEnabled,
    $backgroundPlayEnabled,
    set$backgroundPlayEnabled,
  } = useStore();
  const { data } = useVideoInfo(route.params.bvid);
  const videoInfo = { ...route.params, ...data };
  const pageInfo = videoInfo.pages?.[currentPage - 1];
  const cid = pageInfo?.cid ?? videoInfo.cid ?? 0;
  const durationSeconds = pageInfo?.duration ?? videoInfo.duration ?? 0;

  const isCellular = netInfo.type === NetInfoStateType.cellular;
  const networkReady = netInfo.type !== null && netInfo.type !== undefined;
  const [highQuality, setHighQuality] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [fastRate, setFastRate] = React.useState(false);
  const [playerError, setPlayerError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [currentTimeMs, setCurrentTimeMs] = React.useState(0);
  const [seekToken, setSeekToken] = React.useState(0);
  const lastTimeRef = React.useRef(0);
  const pausedByImagesRef = React.useRef(false);

  const qn = resolvePreferredQuality(isCellular, highQuality);
  const { uri, error: playUrlError, retry } = useVideoPlayUrl(videoInfo.bvid, cid, qn);
  const source = uri ? { uri, headers: { Referer: PLAY_URL_REFERER, "User-Agent": UA } } : null;

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
    if (status === "error") {
      setPlayerError(error?.message ?? "视频播放失败");
    } else if (status === "readyToPlay") {
      setPlayerError(null);
    }
  });

  useEventListener(player, "playToEnd", () => {
    onPlayEnded();
  });

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
    };
  }, []);

  function handleSeek(timeMs: number) {
    player.currentTime = timeMs / 1000;
    lastTimeRef.current = Math.round(timeMs);
    setCurrentTimeMs(Math.round(timeMs));
    setSeekToken((token) => token + 1);
  }

  function handleSingleTap() {
    if (resolveTapAction(isPlaying) === "play") {
      player.play();
    }
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
    try {
      await retry();
      if (player.status === "error" && source) {
        await player.replaceAsync(source);
      }
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
  });

  let videoWidth = pageInfo?.width ?? videoInfo.width;
  let videoHeight = pageInfo?.height ?? videoInfo.height;
  if (!pageInfo && videoInfo.rotate && videoWidth && videoHeight) {
    const swap = videoWidth;
    videoWidth = videoHeight;
    videoHeight = swap;
  }
  const inlineHeight = resolveInlinePlayerHeight({
    screenWidth: width,
    screenHeight: height,
    videoWidth,
    videoHeight,
  });
  const containerHeight = fullscreen ? height : inlineHeight;
  const hasError = Boolean(playerError) || (Boolean(playUrlError) && !uri);
  const showError = hasError || isRetrying;

  return (
    <View
      renderToHardwareTextureAndroid
      className="relative w-full shrink-0 overflow-hidden bg-black"
      style={
        fullscreen
          ? { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }
          : { height: inlineHeight }
      }
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="contain"
        allowsPictureInPicture={false}
      />
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
      {started && !isPlaying && !hasError ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-black/40">
            <Icon name="play" type="material-design" size={34} color="#ffffff" />
          </View>
        </View>
      ) : null}
      {started ? (
        <PlayerControls
          isPlaying={isPlaying}
          currentTimeMs={currentTimeMs}
          durationMs={durationSeconds * 1000}
          danmakuEnabled={$danmakuEnabled}
          backgroundPlayEnabled={$backgroundPlayEnabled}
          fullscreen={fullscreen}
          onTogglePlay={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
          onToggleDanmaku={() => {
            set$danmakuEnabled(!$danmakuEnabled);
          }}
          onToggleBackgroundPlay={() => {
            set$backgroundPlayEnabled(!$backgroundPlayEnabled);
          }}
          onToggleFullscreen={() => {
            onFullscreenChange(!fullscreen);
          }}
          onSeek={handleSeek}
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
    </View>
  );
}
