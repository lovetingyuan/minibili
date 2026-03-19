import { useNavigation } from "@react-navigation/native";
import { Button, Icon } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";

import { colors } from "@/constants/colors.tw";

import type { NavigationProps } from "../../types";

export function HeaderRight() {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  return (
    <View className="flex-row items-center gap-1">
      <Button
        radius={"sm"}
        type="clear"
        onPress={() => {
          navigation.navigate("SearchUps");
        }}
      >
        <Icon name="search" colorClassName={colors.gray7.accent} size={24} />
      </Button>
      <Button
        radius={"sm"}
        type="clear"
        onPress={() => {
          navigation.navigate("About");
        }}
      >
        <Icon name="snow" type="ionicon" size={20} colorClassName={colors.primary.accent} />
      </Button>
    </View>
  );
}

export const followHeaderRight = () => {
  return <HeaderRight />;
};
