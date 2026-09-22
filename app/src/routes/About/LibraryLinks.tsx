import { useNavigation } from "@react-navigation/native";
import { ChevronRight, Clock, History, Star } from "lucide-react-native";
import { View } from "react-native";

import { ListItem } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { colors } from "@/constants/colors.tw";
import type { MainTabNavigationProp } from "@/types";

export default function LibraryLinks() {
  const navigation = useNavigation<MainTabNavigationProp>();

  return (
    <View className="gap-1">
      <ListItem
        accessibilityRole="button"
        accessibilityLabel="我的收藏"
        containerClassName="rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate("Favorites")}
      >
        <ThemedIcon icon={Star} colorClassName={colors.primary.accent} />
        <ListItem.Content>
          <ListItem.Title>我的收藏</ListItem.Title>
        </ListItem.Content>
        <ThemedIcon icon={ChevronRight} size={16} colorClassName={colors.gray4.accent} />
      </ListItem>
      <ListItem
        accessibilityRole="button"
        accessibilityLabel="观看历史"
        containerClassName="rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate("History")}
      >
        <ThemedIcon icon={History} colorClassName={colors.primary.accent} />
        <ListItem.Content>
          <ListItem.Title>观看历史</ListItem.Title>
        </ListItem.Content>
        <ThemedIcon icon={ChevronRight} size={16} colorClassName={colors.gray4.accent} />
      </ListItem>
      <ListItem
        accessibilityRole="button"
        accessibilityLabel="稍后再看"
        containerClassName="rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate("WatchLater")}
      >
        <ThemedIcon icon={Clock} colorClassName={colors.primary.accent} />
        <ListItem.Content>
          <ListItem.Title>稍后再看</ListItem.Title>
        </ListItem.Content>
        <ThemedIcon icon={ChevronRight} size={16} colorClassName={colors.gray4.accent} />
      </ListItem>
    </View>
  );
}
