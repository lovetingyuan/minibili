import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type PlayerErrorProps = {
  retrying: boolean;
  onRetry: () => void;
};

export default function PlayerError(props: PlayerErrorProps) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/80 px-8">
      {props.retrying ? (
        <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
      ) : (
        <>
          <Text className="text-lg font-bold text-white">视频加载失败</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-white/80">
            播放地址获取失败或播放器出错，请稍后重试
          </Text>
          <Pressable
            accessibilityRole="button"
            className={`mt-4 rounded-full px-6 py-3 ${theme.primary.bg}`}
            onPress={props.onRetry}
          >
            <Text className="font-bold text-white">重试</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
