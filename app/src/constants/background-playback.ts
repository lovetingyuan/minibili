import type { BackgroundPlayDurationMinutes } from "@/types/background-playback";

export const BACKGROUND_PLAY_DURATIONS: readonly BackgroundPlayDurationMinutes[] = [
  0, 30, 60, 90, 120,
];

export function isBackgroundPlayDuration(value: unknown): value is BackgroundPlayDurationMinutes {
  return BACKGROUND_PLAY_DURATIONS.some((duration) => duration === value);
}

export function formatBackgroundPlayDuration(duration: BackgroundPlayDurationMinutes) {
  return duration === 0 ? "不限时间" : `${duration}分钟`;
}
