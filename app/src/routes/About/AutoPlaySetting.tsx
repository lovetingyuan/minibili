import { View } from "react-native";

import { Switch } from "@/components/Switch";
import { Text } from "@/components/Text";
import { theme } from "@/constants/colors.tw";
import { useStore } from "@/store";

export default function AutoPlaySetting() {
  const { $autoPlayEnabled, set$autoPlayEnabled } = useStore();

  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text className="font-semibold">自动播放</Text>
        <Text className={`text-xs ${theme.text.muted}`}>仅在非流量网络下生效</Text>
      </View>
      <Switch
        accessibilityLabel="自动播放"
        accessibilityHint="仅在非流量网络下生效"
        accessibilityState={{ checked: $autoPlayEnabled }}
        value={$autoPlayEnabled}
        onValueChange={set$autoPlayEnabled}
        colorClassName={theme.secondary.accent}
        trackColorOnClassName={theme.secondary.accent}
        trackColorOffClassName={theme.background.fillMuted.accent}
      />
    </View>
  );
}
