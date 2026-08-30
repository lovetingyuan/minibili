import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import type { FavoriteFolderTabsProps } from "./Favorites.types";

export default function FavoriteFolderTabs({
  folders,
  selectedId,
  disabled,
  onSelect,
}: FavoriteFolderTabsProps) {
  return (
    <View className={`border-b ${colors.gray2.border}`}>
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
            disabled={disabled}
            onPress={() => onSelect(folder.id)}
            className={`rounded-full px-4 py-2 ${selectedId === folder.id ? colors.gray2.bg : colors.gray1.bg}`}
          >
            <Text
              className={`text-sm ${selectedId === folder.id ? `${colors.primary.text} font-bold` : colors.gray6.text}`}
            >
              {folder.title}（{folder.media_count}）
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
