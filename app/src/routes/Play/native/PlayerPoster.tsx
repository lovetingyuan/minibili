import { ActivityIndicator, ImageBackground, StyleSheet, View } from "react-native";

import { colors } from "@/constants/colors.tw";
import { getImagePixelDimensions, parseImgUrl } from "@/utils";

type PlayerPosterProps = {
  cover?: string;
  containerWidth: number;
  containerHeight: number;
  loading: boolean;
};

/**
 * 视频首帧渲染前的封面兜底：
 * 自动开播后播放器要先加载、解码才会出画面，这段时间用视频封面盖住，避免出现黑屏，
 * 同时叠加转圈提示用户视频正在加载，首帧渲染完成后一起撤掉
 */
export default function PlayerPoster(props: PlayerPosterProps) {
  const coverSize = getImagePixelDimensions(props.containerWidth, props.containerHeight);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {props.cover ? (
        <ImageBackground
          style={StyleSheet.absoluteFill}
          source={{ uri: parseImgUrl(props.cover, coverSize) }}
          resizeMode="cover"
        />
      ) : null}
      {props.loading ? (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center">
          <ActivityIndicator
            accessibilityLabel="视频加载中"
            size="large"
            colorClassName={colors.secondary.accent}
          />
        </View>
      ) : null}
    </View>
  );
}
