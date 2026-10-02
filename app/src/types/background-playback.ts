export type BackgroundPlayDurationMinutes = 0 | 30 | 60 | 90 | 120;

/** null 关闭后台播放，0 不限时间。 */
export type BackgroundPlaySelection = BackgroundPlayDurationMinutes | null;
