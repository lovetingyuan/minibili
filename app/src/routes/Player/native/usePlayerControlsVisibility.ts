import React from "react";

import { resolveControlsAutoHideMs, toggleControlsVisible } from "./player-helpers";

/**
 * 播放控件的显示/隐藏状态。
 * 播放中无操作 3 秒自动隐藏，暂停时保持显示；
 * 点击视频切换显隐，控件操作会重置自动隐藏计时。
 * 暂停时点击继续播放会主动隐藏控件，此时暂停态不再强制显示控件，
 * 直到真正开始播放（或用户再次点击视频）。
 * 暂停态下点击视频同样可以隐藏控件：暂停只负责「默认显示」，
 * 用户主动点击隐藏后保持隐藏，直到再次点击或真正开始播放。
 */
export function usePlayerControlsVisibility(isPlaying: boolean) {
  const [controlsVisible, setControlsVisible] = React.useState(true);
  // 每次操作自增，用于重启自动隐藏计时
  const [interactionToken, setInteractionToken] = React.useState(0);
  // 暂停态会默认显示控件，用该标记跳过强制显示，避免隐藏后立刻又被显示出来
  const hideUntilPlayingRef = React.useRef(false);

  React.useEffect(() => {
    if (!isPlaying) {
      if (hideUntilPlayingRef.current) {
        return;
      }
      setControlsVisible(true);
      return;
    }
    hideUntilPlayingRef.current = false;
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

  function hideControls() {
    hideUntilPlayingRef.current = true;
    setControlsVisible(false);
  }

  function toggleControls() {
    const nextVisible = toggleControlsVisible(controlsVisible);
    // 暂停态下隐藏必须同步标记，否则暂停态的强制显示会立刻把控件弹回来
    hideUntilPlayingRef.current = !nextVisible;
    setControlsVisible(nextVisible);
    if (nextVisible) {
      // 重新显示后重新开始倒计时
      setInteractionToken((token) => token + 1);
    }
  }

  function keepControlsVisible() {
    hideUntilPlayingRef.current = false;
    setControlsVisible(true);
    setInteractionToken((token) => token + 1);
  }

  return { controlsVisible, toggleControls, keepControlsVisible, hideControls };
}
