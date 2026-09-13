import React from "react";

import { resolveControlsAutoHideMs, toggleControlsVisible } from "./player-helpers";

/**
 * 播放控件的显示/隐藏状态。
 * 播放中无操作 3 秒自动隐藏，暂停时保持显示；
 * 点击视频切换显隐，控件操作会重置自动隐藏计时。
 */
export function usePlayerControlsVisibility(isPlaying: boolean) {
  const [controlsVisible, setControlsVisible] = React.useState(true);
  // 每次操作自增，用于重启自动隐藏计时
  const [interactionToken, setInteractionToken] = React.useState(0);

  React.useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      return;
    }
    if (!controlsVisible) {
      return;
    }
    const timeoutMs = resolveControlsAutoHideMs(isPlaying);
    if (timeoutMs === null) {
      return;
    }
    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, timeoutMs);
    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying, controlsVisible, interactionToken]);

  function toggleControls() {
    const nextVisible = toggleControlsVisible(controlsVisible);
    setControlsVisible(nextVisible);
    if (nextVisible) {
      // 重新显示后重新开始倒计时
      setInteractionToken((token) => token + 1);
    }
  }

  function keepControlsVisible() {
    setControlsVisible(true);
    setInteractionToken((token) => token + 1);
  }

  return { controlsVisible, toggleControls, keepControlsVisible };
}
