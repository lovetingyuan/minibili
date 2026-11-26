import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import type { BilibiliAccount } from "@/features/bilibili-session/types";

export const sentryNavigation = Sentry.reactNavigationIntegration();

export function initSentry() {
  const extra = Constants.expoConfig?.extra;
  if (typeof extra?.sentryDsn !== "string" || !extra.sentryDsn) {
    return;
  }

  const environment =
    typeof extra.sentryEnvironment === "string" && extra.sentryEnvironment
      ? extra.sentryEnvironment
      : "production";

  Sentry.init({
    dsn: extra.sentryDsn,
    environment: __DEV__ ? "development" : environment,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1 : 0.1,
    tracePropagationTargets: [],
    enableLogs: true,
    integrations: [sentryNavigation, Sentry.mobileReplayIntegration()],
    replaysOnErrorSampleRate: 0.1,
  });
}

export function setSentryBilibiliUser(account: BilibiliAccount | null) {
  Sentry.setUser(account ? { id: account.mid, username: account.profile.name } : null);
}
