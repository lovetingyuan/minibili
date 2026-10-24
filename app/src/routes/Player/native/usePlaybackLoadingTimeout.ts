import { useEffect, useEffectEvent } from "react";
import { AppState } from "react-native";

import type { PlaybackLoadingTimeoutOptions } from "./playback-loading-timeout.types";

const LOADING_TIMEOUT_MS = 12_000;

export function usePlaybackLoadingTimeout({
  player,
  enabled,
  attemptToken,
  onTimeout,
}: PlaybackLoadingTimeoutOptions) {
  const handleTimeout = useEffectEvent(onTimeout);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let position = player.currentTime;
    let loadingSince = player.status === "loading" ? Date.now() : null;
    const timer = setInterval(() => {
      const now = Date.now();
      const nextPosition = player.currentTime;
      if (AppState.currentState !== "active" || player.status !== "loading") {
        loadingSince = null;
      } else if (loadingSince === null || nextPosition !== position) {
        loadingSince = now;
      } else if (now - loadingSince >= LOADING_TIMEOUT_MS) {
        clearInterval(timer);
        handleTimeout();
      }
      // 缓冲字节增加不代表能继续播放，避免慢速回包无限延长等待。
      position = nextPosition;
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptToken, enabled, player]);
}
