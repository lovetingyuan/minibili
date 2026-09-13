import { Image as ExpoImage } from "@/components/styled/expo";
import { CheckBox } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { ImageBackground, Pressable, Text, View } from "react-native";

import { getImagePixelDimensions, parseDuration, parseImgUrl } from "@/utils";

type PlayerCoverProps = {
  cover?: string;
  containerWidth: number;
  containerHeight: number;
  duration?: number;
  isCellular: boolean;
  highQuality: boolean;
  onToggleHighQuality: () => void;
  onStart: () => void;
};

export default function PlayerCover(props: PlayerCoverProps) {
  const { cover, duration, isCellular, highQuality } = props;
  const coverSize = getImagePixelDimensions(props.containerWidth, props.containerHeight);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="开始播放"
      className="flex-1"
      onPress={props.onStart}
    >
      {cover ? (
        <ImageBackground
          source={{ uri: parseImgUrl(cover, coverSize) }}
          resizeMode="cover"
          className="flex-1 items-center justify-center"
        >
          <ExpoImage
            source={require("../../../../assets/play.png")}
            className="h-16 w-16 opacity-80"
          />
          <View className="absolute bottom-2 left-2 flex-row gap-2">
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
            <View className="absolute bottom-2 right-2">
              <CheckBox
                checked={highQuality}
                title="高清"
                textClassName="text-white"
                wrapperClassName="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold"
                checkedColorClassName={colors.secondary.accent}
                uncheckedColor={"white"}
                size={18}
                containerClassName="bg-transparent p-0 m-0"
                onPress={props.onToggleHighQuality}
              />
            </View>
          ) : null}
        </ImageBackground>
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          <ExpoImage
            source={require("../../../../assets/play.png")}
            className="h-16 w-16 opacity-80"
          />
        </View>
      )}
    </Pressable>
  );
}
