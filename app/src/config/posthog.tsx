import Constants from "expo-constants";
import type { PropsWithChildren } from "react";
import { PostHogProvider } from "posthog-react-native";
import PostHog from "posthog-react-native";

const extra = Constants.expoConfig?.extra;
const enabled = extra?.posthogEnabled === true;
const projectToken = extra?.posthogProjectToken as string | undefined;
const host = extra?.posthogHost as string | undefined;
const config =
  enabled && projectToken && host && projectToken !== "phc_your_project_token_here"
    ? { projectToken, host }
    : null;

export const posthog = config
  ? new PostHog(config.projectToken, {
      host: config.host,
      captureAppLifecycleEvents: true,
      capturePushNotificationOpened: false,
      capturePushNotificationSubscriptions: false,
      disableRemoteFeatureFlags: true,
      disableSurveys: true,
      enableSessionReplay: false,
      errorTracking: {
        autocapture: {
          androidNdkCrashes: true,
          console: false,
          nativeCrashes: true,
          uncaughtExceptions: true,
          unhandledRejections: true,
        },
      },
    })
  : undefined;

export function PostHogNavigationProvider({ children }: PropsWithChildren) {
  if (!posthog) {
    return children;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{ captureScreens: false, captureTouches: false }}
    >
      {children}
    </PostHogProvider>
  );
}
