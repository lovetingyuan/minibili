export const PLAYBACK_RATES = [0.5, 0.8, 1, 1.5, 2, 3] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export function formatPlaybackRate(rate: PlaybackRate) {
  return `${rate}x`;
}
