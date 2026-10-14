import { FileWarning } from "lucide-react-native";
import { View } from "react-native";

import { LoadErrorText } from "@/components/LoadErrorText";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/colors.tw";

import type { WebViewErrorProps } from "./WebViewError.types";

export default function WebViewError({ onRefresh }: WebViewErrorProps) {
  return (
    <View
      className={`absolute inset-0 items-center justify-center gap-3 px-6 py-4 ${theme.background.surface}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${theme.primary.tint}`}>
        <ThemedIcon icon={FileWarning} size={24} colorClassName={theme.primary.text} />
      </View>
      <LoadErrorText onRetry={onRefresh} />
    </View>
  );
}
