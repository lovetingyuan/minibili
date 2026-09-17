import { ActivityIndicator, ImageBackground, StyleSheet, View } from "react-native";

import { colors } from "@/constants/colors.tw";
import { getImagePixelDimensions, parseImgUrl } from "@/utils";

type PlayerPosterProps = {
  cover?: string;
  containerWidth: number;
  loading: boolean;
};

/**
 * 视频首帧渲染前的封面兜底：
 * 进入播放页后持续复用同一个封面实例，自动开播后播放器要先加载、解码才会出画面，
 * 这段时间在封面上叠加转圈提示，首帧渲染完成后一起撤掉
 */
export default function PlayerPoster(props: PlayerPosterProps) {
  // B站视频封面固定按 16:9 请求，避免播放器上下留白或高度动画改变 CDN URL，
  // 导致已经显示的封面被清空并重新加载。
  const coverSize = getImagePixelDimensions(props.containerWidth, (props.containerWidth * 9) / 16);
  const coverUri = props.cover ? parseImgUrl(props.cover, coverSize) : null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {coverUri ? (
        <ImageBackground
          style={StyleSheet.absoluteFill}
          source={{ uri: coverUri }}
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
