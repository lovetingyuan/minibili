import React from "react";

import type { InitialResumeSnapshot } from "./player-helpers";
import { resolveInitialResumeSnapshot } from "./player-helpers";

/**
 * 初始续播位置：本地按分 P 记录的位置优先，同一个分 P 只在首次拿到本地进度时
 * 冻结一次；之后本地进度再变化也不改写。
 */
export function usePlaybackResumeState(key: string, localPositionMs: number | null) {
  const [initialLocalResume, setInitialLocalResume] = React.useState<InitialResumeSnapshot>({
    key: "",
    positionMs: null,
  });
  const resolved = resolveInitialResumeSnapshot(initialLocalResume, key, localPositionMs);
  if (resolved !== initialLocalResume) {
    setInitialLocalResume(resolved);
  }
  return resolved.positionMs;
}
