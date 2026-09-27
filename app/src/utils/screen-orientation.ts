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
  void screenOrientation.lockAsync(screenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

/**
 * 解锁方向，交回系统默认策略（原生模块缺失时静默跳过）。
 * 现在只作为横向锁定失败时的兜底，正常播放流程不会再主动解锁
 */
export function unlockOrientation() {
  const screenOrientation = getScreenOrientation();
  if (!screenOrientation) {
    return;
  }
  void screenOrientation.unlockAsync().catch(() => {});
}

/**
 * 锁定横屏（原生模块缺失时静默跳过）
 *
 * Android 上对应 SCREEN_ORIENTATION_SENSOR_LANDSCAPE：强制转为横向并跟随传感器
 * 决定是横屏左还是横屏右，不受系统自动旋转开关影响；iOS 上是 landscape mask。
 * 设备或系统不支持横向时退回解锁，至少让用户还能手动旋转
 */
export function lockLandscapeOrientation() {
  const screenOrientation = getScreenOrientation();
  if (!screenOrientation) {
    return;
  }
  void screenOrientation.lockAsync(screenOrientation.OrientationLock.LANDSCAPE).catch(() => {
    unlockOrientation();
  });
}
