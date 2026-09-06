import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";

import { Icon, ListItem } from "@/components/styled/rneui";
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
        <Icon name="star-outline" colorClassName={colors.primary.accent} />
        <ListItem.Content>
          <ListItem.Title>我的收藏</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <ListItem
        accessibilityRole="button"
        accessibilityLabel="观看历史"
        containerClassName="rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate("History")}
      >
        <Icon name="history" colorClassName={colors.primary.accent} />
        <ListItem.Content>
          <ListItem.Title>观看历史</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
    </View>
  );
}
