import { ImageBackground, StyleSheet, View } from "react-native";

import { getImagePixelDimensions, parseImgUrl } from "@/utils";

type PlayerPosterProps = {
  cover?: string;
  containerWidth: number;
  containerHeight: number;
};

/**
 * 视频首帧渲染前的封面兜底：
 * 自动开播后播放器要先加载、解码才会出画面，这段时间用视频封面盖住，避免出现黑屏
 */
export default function PlayerPoster(props: PlayerPosterProps) {
  if (!props.cover) {
    return null;
  }

  const coverSize = getImagePixelDimensions(props.containerWidth, props.containerHeight);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground
        style={StyleSheet.absoluteFill}
        source={{ uri: parseImgUrl(props.cover, coverSize) }}
        resizeMode="cover"
      />
    </View>
  );
}
