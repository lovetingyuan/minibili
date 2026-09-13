import * as ScreenOrientation from "expo-screen-orientation";
import React from "react";
import { AppState, Platform } from "react-native";

let fullscreenOwner = false;

/**
 * 播放器进入/退出全屏时抢占方向控制权，避免回到前台时被重新锁成竖屏
 */
export function setFullscreenOrientationOwner(owned: boolean) {
  fullscreenOwner = owned;
}

/**
 * 应用整体保持竖屏：app.config 的 orientation 设置为 default 后，
 * 由这里在启动与回到前台时锁定竖屏，播放器全屏时再临时解锁。
 */
export function lockAppPortrait() {
  if (Platform.OS === "web" || fullscreenOwner) {
    return;
  }
  void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export default function useAppOrientation() {
  React.useEffect(() => {
    lockAppPortrait();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        lockAppPortrait();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);
}
