/** 进度数据快照：观看历史接口换算成「比例 + 时间」后的结果 */
export type WatchProgressSnapshot = {
  /** 观看进度比例（0~1） */
  ratio: number;
  /** 该进度对应的时间（毫秒时间戳） */
  updatedAt: number;
};

/**
 * 观看进度比例（0~1）。
 * 已看完（接口用 `progress = -1` 表示已看完），或进度不小于时长都算 100%；
 * 进度或时长无效时按无进度处理，避免出现假的进度条。
 */
export function getProgressRatio(progress: number, duration: number, finished: boolean) {
  if (finished || progress < 0) {
    return 1;
  }
  if (!Number.isFinite(progress) || !Number.isFinite(duration) || duration <= 0 || progress <= 0) {
    return 0;
  }
  return Math.min(1, progress / duration);
}
