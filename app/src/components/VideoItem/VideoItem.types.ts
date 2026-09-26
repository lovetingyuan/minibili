import type { OverlayButton, VideoListItemInfo } from "@/types";

export type VideoListItemProps<T extends VideoListItemInfo> = {
  video: T;
  playCountOnCover?: boolean;
  watchedAt?: number;
  /** 观看进度比例（0~1），大于 0 时在封面底部展示进度条 */
  progressRatio?: number;
  buttons?: (vi: T) => OverlayButton[];
};

export type VideoCoverProps = {
  uri: string;
};
