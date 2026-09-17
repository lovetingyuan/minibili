import React from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Icon, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import type { FollowGroupTabsProps } from "./FollowGroups.types";

export default function FollowGroupTabs({
  tabs,
  selectedKey,
  disabled,
  onSelect,
  onLongPress,
  onCreate,
}: FollowGroupTabsProps) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [offsets, setOffsets] = React.useState<Record<string, number>>({});
  const selectedOffset = offsets[selectedKey];

  React.useEffect(() => {
    if (selectedOffset === undefined) {
      return;
    }
    scrollRef.current?.scrollTo({ x: Math.max(0, selectedOffset - 16), animated: true });
  }, [selectedKey, selectedOffset]);

  return (
    <View className={`flex-row items-center border-b ${colors.gray2.border}`}>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="gap-2 py-3 pl-3"
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.name}，${tab.count} 个关注`}
            accessibilityState={{ selected: selectedKey === tab.key, disabled }}
            accessibilityHint={tab.custom ? "长按打开分组操作菜单" : undefined}
            disabled={disabled}
            onLayout={({ nativeEvent }) => {
              const x = nativeEvent.layout.x;
              setOffsets((previous) => (previous[tab.key] === x ? previous : { ...previous, [tab.key]: x }));
            }}
            onPress={() => {
              onSelect(tab);
            }}
            onLongPress={
              tab.custom
                ? () => {
                    onLongPress(tab);
                  }
                : undefined
            }
            className={`rounded-full px-4 py-2 ${
              selectedKey === tab.key ? colors.gray2.bg : colors.gray1.bg
            }`}
          >
            <Text
              className={`text-sm ${
                selectedKey === tab.key ? `${colors.primary.text} font-bold` : colors.gray6.text
              }`}
            >
              {tab.name}（{tab.count}）
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className={`justify-center self-stretch border-l py-3 pl-2 pr-3 ${colors.gray2.border}`}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="新建分组"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onCreate}
          className={`h-8 w-8 items-center justify-center rounded-full ${colors.gray1.bg}`}
        >
          <Icon name="plus" type="material-community" size={18} colorClassName={colors.gray7.accent} />
        </Pressable>
      </View>
    </View>
  );
}
