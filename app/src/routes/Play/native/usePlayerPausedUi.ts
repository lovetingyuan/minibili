import React from "react";

import { PLAYER_PAUSED_UI_DELAY_MS } from "./player-helpers";

/**
 * 是否展示暂停态的 UI（中间的续播按钮、控制条上的播放图标）。
 *
 * 起播、seek、缓冲都会让 playing 短暂变成 false，直接跟随 playing 会让这些控件
 * 在视频刚开始播放时闪一下，因此：
 * - 暂停持续超过 PLAYER_PAUSED_UI_DELAY_MS 才认为用户真的暂停了；
 * - 播放器处于 loading（加载 / 缓冲 / seek）时不算暂停；
 * 恢复播放时立刻切回播放态。
 */
export function usePlayerPausedUi(isPlaying: boolean, loading: boolean) {
  // 初始按播放态处理：进入播放页后视频总会自动开播，
  // 先显示播放态可以避免控制条上的图标在起播瞬间跳一下
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (isPlaying) {
      setPaused(false);
      return;
    }
    const timer = setTimeout(() => {
      setPaused(true);
    }, PLAYER_PAUSED_UI_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying]);

  // 恢复播放后立刻切回播放态，不必等 effect 里的状态同步
  return !isPlaying && paused && !loading;
}
