import React from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import { shouldCollapseDescription, VIDEO_DESCRIPTION_COLLAPSED_LINES } from "./description";

type VideoDescriptionViewProps = {
  text: string;
  collapsed?: boolean;
  onToggle?: () => void;
};

export function VideoDescriptionView(props: VideoDescriptionViewProps) {
  const { text, collapsed, onToggle } = props;
  if (!text) {
    return null;
  }
  const collapsible = shouldCollapseDescription(text);
  const isCollapsed = collapsible && Boolean(collapsed);

  return (
    <View className="mt-3">
      <Text selectable numberOfLines={isCollapsed ? VIDEO_DESCRIPTION_COLLAPSED_LINES : undefined}>
        {text}
      </Text>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? "展开完整简介" : "收起简介"}
          className="mt-1 self-end py-1"
          hitSlop={8}
          onPress={onToggle}
        >
          <Text className={`text-sm ${colors.primary.text}`}>
            {isCollapsed ? "显示更多" : "收起"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function VideoDescription(props: { text: string }) {
  const [collapsed, setCollapsed] = React.useState(true);
  return (
    <VideoDescriptionView
      text={props.text}
      collapsed={collapsed}
      onToggle={() => setCollapsed((current) => !current)}
    />
  );
}

export default VideoDescription;
