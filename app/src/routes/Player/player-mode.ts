export type PlayerMode = "native" | "web";

/**
 * 播放页使用的播放器实现。基于 expo-video 的原生播放器为默认实现，
 * 旧的网页版播放器实现暂时保留，改成 "web" 即可回退。
 */
export const PLAYER_MODE: PlayerMode = "native";
