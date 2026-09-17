import { Image as ExpoImage } from "@/components/styled/expo";
import { Switch } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { Pressable, Text, View } from "react-native";

import { parseDuration } from "@/utils";

type PlayerCoverProps = {
  duration?: number;
  isCellular: boolean;
  highQuality: boolean;
  onHighQualityChange: (enabled: boolean) => void;
  onStart: () => void;
};

function PlayerPlayIcon() {
  return (
    <ExpoImage source={require("../../../../assets/play.png")} className="h-16 w-16 opacity-80" />
  );
}

export default function PlayerCover(props: PlayerCoverProps) {
  const { duration, isCellular, highQuality } = props;

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
        {isCellular ? (
          <Text className="rounded bg-gray-900/60 px-2 py-[2px] font-bold text-white">
            播放将消耗流量
          </Text>
        ) : null}
      </View>
      {isCellular ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="高清播放"
          accessibilityHint="开启后将使用移动流量播放 1080P 视频"
          accessibilityState={{ checked: highQuality }}
          className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded bg-gray-900/60 py-0.5 pl-2 pr-1"
          onPress={() => {
            props.onHighQualityChange(!highQuality);
          }}
        >
          <Text className="font-bold text-white">高清</Text>
          <Switch
            accessible={false}
            pointerEvents="none"
            value={highQuality}
            colorClassName={colors.secondary.accent}
            trackColorOnClassName={colors.secondary.accent}
            trackColorOffClassName={colors.gray4.accent}
            style={{ transform: [{ scale: 0.72 }] }}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
