import type { VideoPlayer } from "expo-video";
import React from "react";
import { AppState, Platform } from "react-native";

import { useStore } from "@/store";

import {
  configureBackgroundPlayback,
  type BackgroundPlaybackConfigurationResult,
} from "./player-lifecycle";

/**
 * 把「后台播放配置」从播放器组件里抽出来：
 * - 只有 Android 的原生补丁暴露 `backgroundPlaybackTimeout`，据此判断是否支持定时；
 * - 关闭 / 打开后台播放、定时到点、通知显隐的变化都收敛到一次幂等的原生写入；
 * - 后台状态下不允许启动播放 service（Android 12+ 限制），返回 "deferred" 由调用方择机重试。
 */
export function useBackgroundPlaybackConfiguration(player: VideoPlayer, playbackStarted: boolean) {
  const { $backgroundPlayEnabled, $backgroundPlayDurationMinutes } = useStore();
  const configurationRef = React.useRef<{
    player: VideoPlayer;
    enabled: boolean;
    showNotification: boolean;
  } | null>(null);

  const backgroundPlayTimerSupported =
    Platform.OS === "android" && typeof player.backgroundPlaybackTimeout === "number";

  function configure(force = false): BackgroundPlaybackConfigurationResult {
    const timerSupported =
      Platform.OS === "android" && typeof player.backgroundPlaybackTimeout === "number";
    if (timerSupported) {
      player.backgroundPlaybackTimeout = $backgroundPlayEnabled
        ? $backgroundPlayDurationMinutes * 60
        : 0;
    }

    const showNotification = $backgroundPlayEnabled && playbackStarted;
    const previous = configurationRef.current;
    if (
      !force &&
      previous?.player === player &&
      previous.enabled === $backgroundPlayEnabled &&
      previous.showNotification === showNotification
    ) {
      return "applied";
    }
    const result = configureBackgroundPlayback(
      player,
      $backgroundPlayEnabled,
      showNotification,
      AppState.currentState,
    );
    if (result !== "deferred") {
      // 失败时也避免每次 timeUpdate 重渲染都重试；下一次回到前台会强制重试。
      configurationRef.current = {
        player,
        enabled: $backgroundPlayEnabled,
        showNotification,
      };
    }
    if (__DEV__ && result === "failed") {
      // oxlint-disable-next-line no-console
      console.warn("background playback service configuration was rejected");
    }
    return result;
  }

  // 让 effect 始终调用最新的 configure，同时不因函数重建而重复执行。
  const configureRef = React.useRef(configure);
  configureRef.current = configure;

  React.useEffect(() => {
    configureRef.current();
  }, [player, playbackStarted, $backgroundPlayEnabled, $backgroundPlayDurationMinutes]);

  return { configure, backgroundPlayTimerSupported };
}
