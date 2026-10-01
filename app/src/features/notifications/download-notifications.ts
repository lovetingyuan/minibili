import * as Notifications from "expo-notifications";
import { initNotifications } from "./handler";

/**
 * 下载类通知共用同一个前台处理器，避免多个下载功能互相覆盖配置。
 */
export function initDownloadNotifications() {
  return initNotifications();
}

/**
 * 下载不依赖通知权限：权限被拒绝时调用方仍可继续下载。
 */
export async function ensureDownloadNotificationPermission() {
  if (process.env.EXPO_OS !== "android" && process.env.EXPO_OS !== "ios") {
    return false;
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    if (!current.canAskAgain) {
      return false;
    }
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
    return requested.granted;
  } catch {
    return false;
  }
}
