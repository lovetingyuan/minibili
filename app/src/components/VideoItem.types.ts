import type { VideoListItemInfo } from "@/types";

export type VideoListItemProps<T extends VideoListItemInfo> = {
  video: T;
  playCountOnCover?: boolean;
  watchedAt?: number;
  buttons?: (vi: T) => {
    text: string;
    onPress: () => void;
  }[];
};
