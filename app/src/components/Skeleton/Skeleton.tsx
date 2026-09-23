import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

import { colors } from "@/constants/colors.tw";
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
  const animationRef = useRef(new Animated.Value(0));
  const animationLoop = useRef<Animated.CompositeAnimation | null>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const baseColor = useResolvedColor(colors.gray3.accent);
  const highlightColor = useResolvedColor(colors.gray4.accent);
  const resolvedClassName = useResolvedStyle(className);
  const resolvedSkeletonClassName = useResolvedStyle(skeletonClassName);

  useEffect(() => {
    animationLoop.current = Animated.timing(animationRef.current, {
      delay: 400,
      duration: 1500,
      toValue: 2,
      useNativeDriver: !!Platform.select({
        native: true,
        web: false,
      }),
    });
    animationRef.current.setValue(0);
    if (animationLoop.current) {
      Animated.loop(animationLoop.current).start();
    }
  }, []);

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
              opacity: animationRef.current.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [1, 0, 1],
              }),
              width: "100%",
            },
            animation === "wave" && {
              transform: [
                {
                  translateX: animationRef.current.interpolate({
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
