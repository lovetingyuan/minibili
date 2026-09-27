import * as Notifications from "expo-notifications";

import {
  ensureDownloadNotificationPermission,
  initDownloadNotifications,
} from "@/features/notifications/download-notifications";

import type { AppUpdateNotificationContent } from "./types";

const APP_UPDATE_NOTIFICATION_ID = "minibili-app-update-download";
const APP_UPDATE_CHANNEL_ID = "app-update-download";
const APP_UPDATE_CHANNEL_NAME = "应用更新";

let initialization: Promise<void> | null = null;

async function setupAppUpdateNotifications() {
  await initDownloadNotifications();
  await Notifications.setNotificationChannelAsync(APP_UPDATE_CHANNEL_ID, {
    name: APP_UPDATE_CHANNEL_NAME,
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
    showBadge: false,
  });
}

export function initAppUpdateNotifications() {
  if (process.env.EXPO_OS !== "android") {
    return Promise.resolve();
  }
  if (!initialization) {
    initialization = setupAppUpdateNotifications().catch(() => undefined);
  }
  return initialization;
}

export async function ensureAppUpdateNotificationPermission() {
  await initAppUpdateNotifications();
  return ensureDownloadNotificationPermission();
}

async function presentAppUpdateNotification(
  content: AppUpdateNotificationContent,
  sticky: boolean,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: APP_UPDATE_NOTIFICATION_ID,
    content: {
      title: content.title,
      body: content.body,
      sound: false,
      sticky,
      autoDismiss: !sticky,
      data: { kind: "app-update-download" },
    },
    trigger: { channelId: APP_UPDATE_CHANNEL_ID },
  });
}

export async function showAppUpdateNotification(content: AppUpdateNotificationContent) {
  try {
    await presentAppUpdateNotification(content, true);
  } catch {
    // 通知失败不能影响 APK 下载
  }
}

export async function finishAppUpdateNotification(content: AppUpdateNotificationContent) {
  try {
    await presentAppUpdateNotification(content, false);
  } catch {
    // 通知失败不能影响安装流程
  }
}
