import { FileWarning } from "lucide-react-native";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";

import type { WebViewErrorProps } from "./WebViewError.types";

export default function WebViewError({ onRefresh }: WebViewErrorProps) {
  return (
    <View
      className={`absolute inset-0 items-center justify-center gap-3 px-6 py-4 ${theme.background.surface}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${theme.primary.tint}`}>
        <ThemedIcon icon={FileWarning} size={24} colorClassName={theme.primary.text} />
      </View>
      <View className="items-center gap-1">
        <Text accessibilityRole="alert" className="text-center text-base font-semibold">
          页面加载失败
        </Text>
        <Text className={`text-center text-sm ${theme.text.muted}`}>检查网络后再试试</Text>
      </View>
      <Button
        title="刷新"
        onPress={onRefresh}
        radius="lg"
        buttonClassName="min-h-10 px-6"
        titleClassName="text-sm"
      />
    </View>
  );
}
