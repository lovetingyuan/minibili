import { clsx } from "clsx";
import { useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";

import { toastStore } from "./toast-store";

export function ToastHost() {
  const shadowColor = useResolvedColor("accent-shadow/24");
  const toast = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 z-50 items-center justify-end px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 24 }}
    >
      {toast ? (
        <Animated.View
          key={toast.id}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          entering={FadeInUp.duration(180)}
          exiting={FadeOutDown.duration(160)}
          className={clsx(
            "max-w-full rounded-xl border px-4 py-2.5",
            theme.toast.bg,
            theme.toast.border,
          )}
          style={{
            borderCurve: "continuous",
            boxShadow: shadowColor ? `0 3px 12px ${shadowColor}` : undefined,
          }}
        >
          <Text className={clsx("text-center text-sm font-medium", theme.toast.text)}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
