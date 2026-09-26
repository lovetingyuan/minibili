import { useEffect, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";
import useResolvedStyle from "@/hooks/useResolvedStyle";

import type { SkeletonProps } from "./Skeleton.types";

const defaultHeight = 12;
const circleRadius = 50;

export function Skeleton({
  animation = "pulse",
  circle = false,
  className,
  height,
  onLayout,
  skeletonClassName,
  style,
  width = "100%",
  ...viewProps
}: SkeletonProps) {
  // Animated.Value 实例在组件生命周期内保持同一个，用 state 承载可以在渲染期安全读取
  const [animationValue] = useState(() => new Animated.Value(0));
  const [layoutWidth, setLayoutWidth] = useState(0);
  const baseColor = useResolvedColor(theme.slate[2].accent);
  const highlightColor = useResolvedColor(theme.slate[3].accent);
  const resolvedClassName = useResolvedStyle(className);
  const resolvedSkeletonClassName = useResolvedStyle(skeletonClassName);

  useEffect(() => {
    animationValue.setValue(0);
    Animated.loop(
      Animated.timing(animationValue, {
        delay: 400,
        duration: 1500,
        toValue: 2,
        useNativeDriver: !!Platform.select({
          native: true,
          web: false,
        }),
      }),
    ).start();
  }, [animationValue]);

  return (
    <View
      {...viewProps}
      accessibilityLabel="loading..."
      accessibilityRole="none"
      accessible={false}
      onLayout={(event) => {
        setLayoutWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
      }}
      style={[
        styles.container,
        {
          backgroundColor: baseColor,
          height: height ?? defaultHeight,
          width,
        },
        circle && {
          borderRadius: circleRadius,
          height: height ?? width,
        },
        style,
        resolvedClassName,
      ]}
      testID="RNE__Skeleton"
    >
      {animation === "none" ? null : (
        <Animated.View
          style={[
            styles.skeleton,
            { backgroundColor: highlightColor },
            animation === "pulse" && {
              opacity: animationValue.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [1, 0, 1],
              }),
              width: "100%",
            },
            animation === "wave" && {
              transform: [
                {
                  translateX: animationValue.interpolate({
                    inputRange: [0, 2],
                    outputRange: [-layoutWidth * 2, layoutWidth * 2],
                  }),
                },
              ],
            },
            resolvedSkeletonClassName,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    overflow: "hidden",
  },
  skeleton: {
    height: "100%",
  },
});
