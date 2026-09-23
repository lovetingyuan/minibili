import { Switch } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import { Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { parseDuration } from "@/utils";

type PlayerCoverProps = {
  duration?: number;
  /** 当前网络会消耗移动流量 */
  isMetered: boolean;
  highQuality: boolean;
  onHighQualityChange: (enabled: boolean) => void;
  onStart: () => void;
};

function PlayerPlayIcon() {
  return <ThemedIcon icon={Play} size={64} color="#ffffff" filled opacity={0.8} />;
}

export default function PlayerCover(props: PlayerCoverProps) {
  const { duration, isMetered, highQuality } = props;

  return (
    <View className="flex-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="开始播放"
        className="absolute inset-0 items-center justify-center"
        onPress={props.onStart}
      >
        <PlayerPlayIcon />
      </Pressable>
      <View pointerEvents="none" className="absolute bottom-2 left-2 flex-row gap-2">
        {duration ? (
          <Text className="rounded bg-gray-900/60 px-2 py-0.5 font-bold text-white">
            {parseDuration(duration)}
          </Text>
        ) : null}
        {isMetered ? (
          <Text className="rounded bg-gray-900/60 px-2 py-[2px] font-bold text-white">
            播放将消耗流量
          </Text>
        ) : null}
      </View>
      {isMetered ? (
        <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded bg-gray-900/60 py-0.5 pl-2 pr-1">
          <Text className="font-bold text-white">1080P</Text>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel="1080P 播放"
            accessibilityHint="开启后将使用移动流量播放 1080P 视频"
            accessibilityState={{ checked: highQuality }}
            value={highQuality}
            onValueChange={props.onHighQualityChange}
            colorClassName={theme.secondary.accent}
            trackColorOnClassName={theme.secondary.accent}
            trackColorOffClassName={theme.background.fillMuted.accent}
            style={{ transform: [{ scale: 0.72 }] }}
          />
        </View>
      ) : null}
    </View>
  );
}
