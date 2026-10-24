import type { VideoPlayer } from "expo-video";

export type PlaybackLoadingTimeoutOptions = {
  player: VideoPlayer;
  enabled: boolean;
  attemptToken: number;
  onTimeout: () => void;
};
