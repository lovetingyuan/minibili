import { View } from "react-native";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useStore } from "@/store";

export default function DanmakuOpacitySetting() {
  const { $danmakuOpacity, set$danmakuOpacity } = useStore();

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 font-semibold">弹幕透明度</Text>
      <View className="flex-row items-center gap-1">
        <Button
          type="outline"
          radius="sm"
          buttonClassName="h-8 w-8 p-0"
          titleClassName="text-sm"
          hitSlop={6}
          title="−"
          accessibilityLabel="减小弹幕不透明度"
          disabled={$danmakuOpacity <= 0}
          onPress={() =>
            set$danmakuOpacity((value) => Math.max(0, Math.round(value * 10) - 1) / 10)
          }
        />
        <Text
          className="w-8 text-center tabular-nums"
          accessibilityLabel={`弹幕透明度 ${$danmakuOpacity.toFixed(1)}`}
        >
          {$danmakuOpacity.toFixed(1)}
        </Text>
        <Button
          type="outline"
          radius="sm"
          buttonClassName="h-8 w-8 p-0"
          titleClassName="text-sm"
          hitSlop={6}
          title="+"
          accessibilityLabel="增大弹幕不透明度"
          disabled={$danmakuOpacity >= 1}
          onPress={() =>
            set$danmakuOpacity((value) => Math.min(10, Math.round(value * 10) + 1) / 10)
          }
        />
      </View>
    </View>
  );
}
