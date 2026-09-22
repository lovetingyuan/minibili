import React from 'react';
import { Plus } from 'lucide-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/styled/rneui';
import { ThemedIcon } from '@/components/ThemedIcon';
import { colors } from '@/constants/colors.tw';

import type { FollowGroupTabsProps } from './FollowGroups.types';

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
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const tabWidthsRef = React.useRef<Record<string, number>>({});
  const scrollXRef = React.useRef(0);

  React.useEffect(() => {
    const left = offsets[selectedKey];
    const width = tabWidthsRef.current[selectedKey];
    if (left === undefined || width === undefined || viewportWidth <= 0) {
      return;
    }
    const padding = 16;
    const start = left - padding;
    const end = left + width + padding;
    const visibleStart = scrollXRef.current;
    const visibleEnd = visibleStart + viewportWidth;
    // 选中的 tab 已经完整可见时不动，否则左右滑动切换分组会让 tab 行自己也来回移动
    if (start >= visibleStart && end <= visibleEnd) {
      return;
    }
    scrollRef.current?.scrollTo({ x: Math.max(0, start), animated: true });
  }, [offsets, selectedKey, viewportWidth]);

  return (
    <View>
      <View className="flex-row items-center">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-2 py-3 pl-3"
          scrollEventThrottle={32}
          onLayout={({ nativeEvent }) => {
            const width = nativeEvent.layout.width;
            setViewportWidth((previous) => (previous === width ? previous : width));
          }}
          onScroll={({ nativeEvent }) => {
            scrollXRef.current = nativeEvent.contentOffset.x;
          }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.name}，${tab.count} 个关注`}
              accessibilityState={{ selected: selectedKey === tab.key, disabled }}
              accessibilityHint={tab.custom ? '长按打开分组操作菜单' : undefined}
              disabled={disabled}
              delayLongPress={300}
              onLayout={({ nativeEvent }) => {
                const { x, width } = nativeEvent.layout;
                tabWidthsRef.current[tab.key] = width;
                setOffsets((previous) => (previous[tab.key] === x ? previous : { ...previous, [tab.key]: x }));
              }}
              onLongPress={() => {
                onLongPress(tab);
              }}
              onPress={() => {
                // 已选中的自定义分组再次点击时也给出编辑入口，长按不便时依然能改名/删除
                if (tab.custom && selectedKey === tab.key) {
                  onLongPress(tab);
                  return;
                }
                onSelect(tab);
              }}
              className={`rounded-full px-4 py-2 ${selectedKey === tab.key ? colors.gray2.bg : colors.gray1.bg}`}
            >
              <Text
                className={`text-sm ${
                  selectedKey === tab.key ? `${colors.primary.text} font-bold` : colors.gray6.text
                }`}
              >
                {tab.name} {tab.count}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View className="justify-center py-3 pl-2 pr-3">
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="新建分组"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onCreate}
            className={`h-8 w-8 items-center justify-center rounded-full ${colors.gray1.bg}`}
          >
            <ThemedIcon icon={Plus} size={18} colorClassName={colors.gray7.accent} />
          </TouchableOpacity>
        </View>
      </View>
      <View className={`h-px w-full ${colors.gray2.bg}`} />
    </View>
  );
}
