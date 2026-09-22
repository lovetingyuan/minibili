import { useNavigation } from "@react-navigation/native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import UpName from "@/components/UpName";
import { colors } from "@/constants/colors.tw";
import type { NavigationProps } from "@/types";

import { shouldCollapseDescription, VIDEO_DESCRIPTION_COLLAPSED_LINES } from "./description";
import type { VideoDescriptionProps, VideoDescriptionViewProps } from "./VideoDescription.types";

/**
 * 折叠时“显示更多”浮在最后一行行尾，用卡片底色盖住压在下方的文字，
 * 高度与 leading-6 的行高一致，正好对齐最后一行。
 */
const COLLAPSED_TOGGLE_CLASS =
  "absolute bottom-2.5 right-3 bg-neutral-50 pl-1.5 dark:bg-neutral-900";
const EXPANDED_TOGGLE_CLASS = "mt-1 self-end px-1";

export function VideoDescriptionView(props: VideoDescriptionViewProps) {
  const { text, nodes, collapsed, onToggle, onMentionPress } = props;
  if (!text) {
    return null;
  }
  const collapsible = shouldCollapseDescription(text);
  const isCollapsed = collapsible && Boolean(collapsed);

  return (
    <View className="relative mt-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
      <Text
        selectable
        className={`text-sm leading-6 ${colors.gray7.text}`}
        numberOfLines={isCollapsed ? VIDEO_DESCRIPTION_COLLAPSED_LINES : undefined}
      >
        {nodes?.length
          ? nodes.map((node, index) => {
              const nodeText = node.type === 2 ? `@${node.rawText} ` : node.rawText;
              const key = `${node.type}-${node.bizId}-${index}`;
              if (node.type === 2 && node.bizId && onMentionPress) {
                return (
                  <UpName
                    accessibilityLabel={`查看UP主 ${node.rawText} 的主页`}
                    accessibilityRole="link"
                    className={colors.primary.text}
                    key={key}
                    mid={node.bizId}
                    onPress={() => onMentionPress(node)}
                  >
                    {nodeText}
                  </UpName>
                );
              }
              return (
                <Text className={colors.gray7.text} key={key}>
                  {nodeText}
                </Text>
              );
            })
          : text}
      </Text>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? "展开完整简介" : "收起简介"}
          className={`flex-row items-center py-1 ${
            isCollapsed ? COLLAPSED_TOGGLE_CLASS : EXPANDED_TOGGLE_CLASS
          }`}
          hitSlop={8}
          onPress={onToggle}
        >
          <Text className={`text-xs font-medium ${colors.primary.text}`}>
            {isCollapsed ? "显示更多" : "收起"}
          </Text>
          <ThemedIcon
            icon={isCollapsed ? ChevronDown : ChevronUp}
            size={16}
            colorClassName={colors.primary.accent}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function VideoDescription(props: VideoDescriptionProps) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const [collapsed, setCollapsed] = React.useState(true);
  return (
    <VideoDescriptionView
      text={props.text}
      nodes={props.nodes}
      collapsed={collapsed}
      onToggle={() => setCollapsed((current) => !current)}
      onMentionPress={(node) => {
        navigation.push("Dynamic", {
          user: {
            face: "",
            mid: node.bizId,
            name: node.rawText,
            sign: "-",
          },
        });
      }}
    />
  );
}

export default VideoDescription;
