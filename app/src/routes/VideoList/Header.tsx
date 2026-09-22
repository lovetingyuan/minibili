import { useNavigation } from "@react-navigation/native";
import { Button, Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { ChevronDown, Search } from "lucide-react-native";
import React from "react";
import { ScrollView, View } from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger, menuOptionClassName } from "@/components/Menu";

import { colors } from "@/constants/colors.tw";
import { useUserSettings } from "@/features/user-data/useUserSettings";

import { useStore } from "../../store";
import type { MainTabNavigationProp } from "../../types";

function splitArrayIntoChunks(arr: any[]) {
  const result = [[arr[0]]];
  for (let i = 1; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }

  return result;
}

function HeaderLeftComp() {
  const { currentVideosCate, setCurrentVideosCate } = useStore();
  const {
    values: { $videoCatesList },
  } = useUserSettings();

  const [visible, setVisible] = React.useState(false);
  const hideMenu = () => setVisible(false);
  const showMenu = () => setVisible(true);
  const list = splitArrayIntoChunks($videoCatesList);
  const getItem = (item: any) => {
    const selected = currentVideosCate.rid === item.rid;
    return (
      <MenuOption
        onSelect={() => {
          setCurrentVideosCate(item);
          hideMenu();
        }}
      >
        <View className={menuOptionClassName}>
          <Text
            numberOfLines={1}
            className={`px-4 text-left text-base ${selected ? "font-bold" : ""} ${item.rid === -1 ? colors.secondary.text : selected ? colors.primary.text : colors.black.text}`}
          >
            {item.label}
          </Text>
        </View>
      </MenuOption>
    );
  };
  return (
    <View className="ml-2 flex-row items-center gap-4">
      <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
        <MenuTrigger onPress={showMenu}>
          <View className="h-full flex-row items-center">
            <Text
              className={`text-lg font-bold ${
                currentVideosCate.rid === -1
                  ? __DEV__
                    ? colors.success.text
                    : colors.secondary.text
                  : colors.gray7.text
              }`}
            >
              {currentVideosCate.label + (currentVideosCate.rid === -1 ? "" : "排行")}{" "}
            </Text>
            <ThemedIcon icon={ChevronDown} size={28} colorClassName={colors.gray6.accent} />
          </View>
        </MenuTrigger>
        <MenuOptions>
          <ScrollView className="max-h-[70vh]">
            {list.map((items, i) => {
              if (i === 0) {
                return (
                  <View key={items[0].rid} className="w-48 flex-1">
                    <View>{getItem(items[0])}</View>
                    <View className={`flex-1 border-b-[0.5px] ${colors.gray3.border}`} />
                  </View>
                );
              }
              return (
                <View key={items[0].rid} className="w-48 flex-row">
                  <View className="w-[50%]">{getItem(items[0])}</View>
                  {items[1] ? <View className="w-[50%]">{getItem(items[1])}</View> : null}
                </View>
              );
            })}
          </ScrollView>
        </MenuOptions>
      </Menu>
    </View>
  );
}

function HeaderRightComp() {
  const navigation = useNavigation<MainTabNavigationProp>();
  return (
    <View className="mr-2">
      <Button
        radius={"sm"}
        size="sm"
        type="clear"
        accessibilityLabel="搜索视频"
        onPress={() => {
          navigation.navigate("SearchVideos");
        }}
      >
        <ThemedIcon icon={Search} colorClassName={colors.gray7.accent} size={24} />
      </Button>
    </View>
  );
}

export const videoListHeaderLeft = () => <HeaderLeftComp />;
export const videoListHeaderRight = () => <HeaderRightComp />;
