/**
 * Vitest 用的 expo-application 替身：纯逻辑单测不需要真实安装信息，
 * 同时避免加载会初始化原生模块的 expo-modules-core。
 */

export const nativeApplicationVersion = "0.0.0-test";
export const nativeBuildVersion = "0";
export const applicationId = "com.tingyuan.minibili.test";
export const applicationName = "MiniBili-test";
