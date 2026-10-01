import * as Notifications from "expo-notifications";
import { AppState } from "react-native";

import { initNotifications } from "@/features/notifications/handler";
import { LiveNotificationDataSchema } from "./background-updates.schema";
import type { LiveNotificationData } from "./types";

const LIVE_CHANNEL_ID = "live-up";
let initialization: Promise<void> | null = null;
let permissionRequest: Promise<void> | null = null;

export function isNativePollingSupported() {
  return process.env.EXPO_OS === "android" || process.env.EXPO_OS === "ios";
}

export async function initLiveNotifications() {
  if (!isNativePollingSupported()) {
    return;
  }
  initialization ??= (async () => {
    await initNotifications();
    if (process.env.EXPO_OS === "android") {
      await Notifications.setNotificationChannelAsync(LIVE_CHANNEL_ID, {
        name: "开播提醒",
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        enableVibrate: false,
        vibrationPattern: null,
        showBadge: false,
      });
    }
  })().catch((error: unknown) => {
    initialization = null;
    throw error;
  });
  await initialization;
}

/** 只在前台首次登录后调用，拒绝过的权限不重复申请。 */
export async function requestLiveNotificationPermission() {
  if (!isNativePollingSupported() || AppState.currentState !== "active") {
    return;
  }
  permissionRequest ??= (async () => {
    await initLiveNotifications();
    const permission = await Notifications.getPermissionsAsync();
    if (
      permission.status === "undetermined" &&
      permission.canAskAgain &&
      AppState.currentState === "active"
    ) {
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: false, allowBadge: false },
      });
    }
  })().finally(() => {
    permissionRequest = null;
  });
  await permissionRequest;
}

export async function showLiveNotification(
  data: LiveNotificationData,
  observedAt: number,
  isCurrent: () => boolean | Promise<boolean>,
) {
  const parsed = LiveNotificationDataSchema.safeParse(data);
  if (!parsed.success || !isNativePollingSupported()) {
    return;
  }
  await initLiveNotifications();
  const permission = await Notifications.getPermissionsAsync();
  if (
    !permission.granted &&
    permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return;
  }
  if (!(await isCurrent())) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: `live-up:${data.accountMid}:${data.mid}:${observedAt}`,
    content: {
      title: `${data.name}开播了`,
      body: "点击进入直播间",
      sound: false,
      data: parsed.data,
    },
    trigger: process.env.EXPO_OS === "android" ? { channelId: LIVE_CHANNEL_ID } : null,
  });
}
