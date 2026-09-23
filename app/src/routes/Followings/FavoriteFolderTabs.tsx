import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import type { FavoriteFolderTabsProps } from "./Favorites.types";

export default function FavoriteFolderTabs({
  folders,
  selectedId,
  disabled,
  onSelect,
  onLongPress,
}: FavoriteFolderTabsProps) {
  return (
    <View className={`border-b ${theme.border.divider}`}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-3 py-3"
      >
        {folders.map((folder) => (
          <Pressable
            key={folder.id}
            accessibilityRole="tab"
            accessibilityLabel={`${folder.title}，${folder.media_count} 个收藏`}
            accessibilityState={{ selected: selectedId === folder.id, disabled }}
            accessibilityHint={onLongPress ? "长按打开收藏夹操作菜单" : undefined}
            disabled={disabled}
            onPress={() => onSelect(folder.id)}
            onLongPress={onLongPress ? () => onLongPress(folder) : undefined}
            className={`rounded-full px-4 py-2 ${selectedId === folder.id ? theme.background.fillStrong.bg : theme.background.fill.bg}`}
          >
            <Text
              className={`text-sm ${selectedId === folder.id ? `${theme.primary.text} font-bold` : theme.text.muted}`}
            >
              {folder.title}（{folder.media_count}）
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
