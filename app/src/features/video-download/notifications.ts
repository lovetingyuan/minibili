import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * 通知标识固定：用同一个 identifier 重新展示通知会在系统里原地替换，
 * 下载进度就是靠这一点持续更新同一条通知。
 */
const VIDEO_DOWNLOAD_NOTIFICATION_ID = "minibili-video-download";

/** 带「取消」按钮的通知分类 */
const VIDEO_DOWNLOAD_CATEGORY_ID = "minibili-video-download";

/** 通知上的取消动作标识 */
const VIDEO_DOWNLOAD_CANCEL_ACTION_ID = "minibili-video-download-cancel";

/** Android 通知渠道：低优先级 + 静音，避免下载过程中反复打扰 */
const VIDEO_DOWNLOAD_CHANNEL_ID = "video-download";

const VIDEO_DOWNLOAD_CHANNEL_NAME = "视频下载";

export type VideoDownloadNotificationContent = {
  title: string;
  body: string;
};

/** expo-notifications 只在原生平台可用，web 上跳过全部通知逻辑 */
function isNotificationSupported() {
  return Platform.OS === "android" || Platform.OS === "ios";
}

async function setupVideoDownloadNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(VIDEO_DOWNLOAD_CHANNEL_ID, {
      name: VIDEO_DOWNLOAD_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
      showBadge: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(VIDEO_DOWNLOAD_CATEGORY_ID, [
    { identifier: VIDEO_DOWNLOAD_CANCEL_ACTION_ID, buttonTitle: "取消" },
  ]);
}

let initPromise: Promise<void> | null = null;

/**
 * 初始化通知处理器、Android 渠道与通知分类，只执行一次且忽略失败。
 */
export function initVideoDownloadNotifications(): Promise<void> {
  if (!isNotificationSupported()) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = setupVideoDownloadNotifications().catch(() => undefined);
  }
  return initPromise;
}

/**
 * 申请通知权限。被拒绝时下载照常进行，只是看不到进度通知。
 */
export async function ensureVideoDownloadNotificationPermission() {
  if (!isNotificationSupported()) {
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

async function presentVideoDownloadNotification(
  content: VideoDownloadNotificationContent,
  sticky: boolean,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: VIDEO_DOWNLOAD_NOTIFICATION_ID,
    content: {
      title: content.title,
      body: content.body,
      sound: false,
      sticky,
      autoDismiss: !sticky,
      categoryIdentifier: VIDEO_DOWNLOAD_CATEGORY_ID,
      data: { kind: "video-download" },
    },
    trigger: Platform.OS === "android" ? { channelId: VIDEO_DOWNLOAD_CHANNEL_ID } : null,
  });
}

/**
 * 展示/更新下载中的进度通知（通知不可划掉）。
 */
export async function showVideoDownloadNotification(content: VideoDownloadNotificationContent) {
  if (!isNotificationSupported()) {
    return;
  }
  try {
    await presentVideoDownloadNotification(content, true);
  } catch {
    // 通知失败不能影响下载本身
  }
}

/**
 * 展示下载终态通知（完成/失败），允许用户划掉。
 */
export async function finishVideoDownloadNotification(
  content: VideoDownloadNotificationContent,
) {
  if (!isNotificationSupported()) {
    return;
  }
  try {
    await presentVideoDownloadNotification(content, false);
  } catch {
    // 通知失败不能影响下载本身
  }
}

export async function dismissVideoDownloadNotification() {
  if (!isNotificationSupported()) {
    return;
  }
  try {
    await Notifications.dismissNotificationAsync(VIDEO_DOWNLOAD_NOTIFICATION_ID);
  } catch {
    // 通知失败不能影响下载本身
  }
}

/**
 * 监听通知上的「取消」按钮，返回可移除的订阅。
 */
export function addVideoDownloadCancelListener(listener: () => void) {
  if (!isNotificationSupported()) {
    return { remove: () => undefined };
  }
  return Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier !== VIDEO_DOWNLOAD_CANCEL_ACTION_ID) {
      return;
    }
    if (response.notification.request.identifier !== VIDEO_DOWNLOAD_NOTIFICATION_ID) {
      return;
    }
    listener();
  });
}
