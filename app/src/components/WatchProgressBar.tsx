import React from "react";
import { View } from "react-native";

import { colors } from "@/constants/colors.tw";

export default WatchProgressBar;

function WatchProgressBar({ progress }: { progress: number }) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden rounded-b bg-black/30 dark:bg-white/15">
      <View className="absolute inset-x-0 top-0 h-px bg-white/35 dark:bg-white/20" />
      <View
        className={`h-full rounded-r-full ${colors.secondary.bg}`}
        style={{ width: `${safeProgress}%` }}
      >
        <View className="absolute inset-x-0 top-0 h-px bg-white/45" />
      </View>
    </View>
  );
}
