import type * as ScreenOrientationModule from "expo-screen-orientation";

type ScreenOrientation = typeof ScreenOrientationModule;

let cached: ScreenOrientation | null | undefined;

/**
 * expo-screen-orientation 在 import 阶段就会 requireNativeModule，
 * 旧版本安装包（还没重新构建）里没有该原生模块会直接抛错，
 * 这里统一做一次可失败的懒加载，保证 App 仍能正常启动。
 */
function getScreenOrientation(): ScreenOrientation | null {
  if (cached !== undefined) {
    return cached;
  }
  try {
    // oxlint-disable-next-line no-var-requires
    cached = require("expo-screen-orientation") as ScreenOrientation;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * 锁定竖屏（原生模块缺失时静默跳过）
 */
export function lockPortraitOrientation() {
  const screenOrientation = getScreenOrientation();
  if (!screenOrientation) {
    return;
  }
  void screenOrientation
    .lockAsync(screenOrientation.OrientationLock.PORTRAIT_UP)
    .catch(() => {});
}

/**
 * 解锁方向（播放器全屏时使用，原生模块缺失时静默跳过）
 */
export function unlockOrientation() {
  const screenOrientation = getScreenOrientation();
  if (!screenOrientation) {
    return;
  }
  void screenOrientation.unlockAsync().catch(() => {});
}
