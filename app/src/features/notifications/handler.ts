import * as Notifications from "expo-notifications";

let initialized = false;

/** 全应用只设置一个处理器，通知渠道决定各类通知的重要性和声音。 */
export function initNotifications(): Promise<void> {
  if (initialized || (process.env.EXPO_OS !== "android" && process.env.EXPO_OS !== "ios")) {
    return Promise.resolve();
  }
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // Android 不能用 handler 关闭声音，否则会一起关闭 heads-up；直播渠道本身静音。
      shouldPlaySound:
        process.env.EXPO_OS === "android" && notification.request.content.data?.kind === "live-up",
      shouldSetBadge: false,
    }),
  });
  initialized = true;
  return Promise.resolve();
}
