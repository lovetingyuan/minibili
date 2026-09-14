import React from "react";
import { Pressable, View } from "react-native";
import type { ViewStyle } from "react-native";
import { useResolveClassNames } from "uniwind";

import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import { shouldCollapseDescription, VIDEO_DESCRIPTION_COLLAPSED_LINES } from "./description";

/** 简介所在页面的底色，用于让渐变淡出与底色衔接（暗色模式下自动切换） */
const DESCRIPTION_SURFACE_CLASS_NAME = "bg-white dark:bg-neutral-950";

type VideoDescriptionViewProps = {
  text: string;
  collapsed?: boolean;
  onToggle?: () => void;
  /** 渐变结束色，取自页面底色；缺失时不绘制渐变 */
  surfaceColor?: string;
};

function createFadeStyle(surfaceColor?: string): ViewStyle | undefined {
  if (!surfaceColor) {
    return undefined;
  }
  return {
    experimental_backgroundImage: [
      {
        type: "linear-gradient",
        direction: "to right",
        colorStops: [{ color: "transparent" }, { color: surfaceColor }],
      },
    ],
  };
}

export function VideoDescriptionView(props: VideoDescriptionViewProps) {
  const { text, collapsed, onToggle, surfaceColor } = props;
  if (!text) {
    return null;
  }
  const collapsible = shouldCollapseDescription(text);
  const isCollapsed = collapsible && Boolean(collapsed);

  return (
    <View className="mt-3">
      <View>
        <Text
          selectable
          numberOfLines={isCollapsed ? VIDEO_DESCRIPTION_COLLAPSED_LINES : undefined}
        >
          {text}
        </Text>
        {isCollapsed ? (
          <View
            className="absolute bottom-0 right-0 flex-row items-stretch"
            pointerEvents="box-none"
          >
            <View className="w-8" pointerEvents="none" style={createFadeStyle(surfaceColor)} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="展开完整简介"
              className="justify-center bg-white pl-1 dark:bg-neutral-950"
              hitSlop={8}
              onPress={onToggle}
            >
              <Text className={`text-sm ${colors.primary.text}`}>显示更多</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {collapsible && !isCollapsed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="收起简介"
          className="mt-1 self-end py-1"
          hitSlop={8}
          onPress={onToggle}
        >
          <Text className={`text-sm ${colors.primary.text}`}>收起</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function VideoDescription(props: { text: string }) {
  const [collapsed, setCollapsed] = React.useState(true);
  const { backgroundColor } = useResolveClassNames(DESCRIPTION_SURFACE_CLASS_NAME);
  return (
    <VideoDescriptionView
      text={props.text}
      collapsed={collapsed}
      surfaceColor={typeof backgroundColor === "string" ? backgroundColor : undefined}
      onToggle={() => setCollapsed((current) => !current)}
    />
  );
}

export default VideoDescription;
