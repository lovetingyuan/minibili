import { useNavigation } from "@react-navigation/native";
import { Badge, Button, Icon, Text } from "@/components/styled/rneui";
import React from "react";
import { Animated, ScrollView, View } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  menuOptionClassName,
} from "@/components/Menu";

import { useAppUpdateInfo } from "@/api/check-update";
import { colors } from "@/constants/colors.tw";
import { useUpUpdateCount } from "@/store/derives";

import { useStore } from "../../store";
import type { NavigationProps } from "../../types";

function HeaderTitleComp() {
  const { current: opacityValue } = React.useRef(new Animated.Value(0));
  const appUpdateInfo = useAppUpdateInfo();
  React.useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    blinkAnimation.start();

    return () => {
      blinkAnimation.stop();
    };
  }, [opacityValue]);

  return appUpdateInfo.hasUpdate ? (
    <Button
      type="clear"
      size="sm"
      buttonClassName="mx-2"
      titleClassName={`text-sm ${colors.primary.text}`}
      onPress={() => {
        appUpdateInfo.showAlert();
      }}
    >
      有新版本
      <Animated.View style={{ opacity: opacityValue }}>
        <Icon name="fiber-new" colorClassName={colors.secondary.accent} size={24} />
      </Animated.View>
    </Button>
  ) : null;
}

function splitArrayIntoChunks(arr: any[]) {
  const result = [[arr[0]]];
  for (let i = 1; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }

  return result;
}

function HeaderLeftComp() {
  const { currentVideosCate, $videoCatesList, setCurrentVideosCate } = useStore();

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
    <View className="flex-row items-center gap-4">
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
            <Icon
              name="triangle-down"
              type="octicon"
              size={28}
              colorClassName={colors.gray6.accent}
            />
          </View>
        </MenuTrigger>
        <MenuOptions>
          <ScrollView className="max-h-[70vh]">
            {list.map((items, i) => {
              if (i === 0) {
                return (
                  <View key={i} className="w-48 flex-1">
                    <View>{getItem(items[0])}</View>
                    <View className={`flex-1 border-b-[0.5px] ${colors.gray3.border}`} />
                  </View>
                );
              }
              return (
                <View key={i} className="w-48 flex-row">
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
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { livingUps } = useStore();
  const _updatedCount = useUpUpdateCount();
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0;
  return (
    <View className="mr-2 flex-row items-center gap-1">
      <Button
        radius={"sm"}
        size="sm"
        type="clear"
        onPress={() => {
          navigation.navigate("SearchVideos");
        }}
      >
        <Icon name="search" colorClassName={colors.gray7.accent} size={24} />
      </Button>
      <View className="relative">
        {_updatedCount ? (
          <Badge
            status="success"
            value={_updatedCount}
            badgeClassName={`absolute left-12 top-1 ${hasLiving ? colors.primary.bg : colors.secondary.bg}`}
            textClassName="text-[10px]"
          />
        ) : null}
        <Button
          type="clear"
          size="sm"
          titleClassName="text-lg"
          onPress={() => {
            navigation.navigate("Follow");
          }}
        >
          {` 关注 ${_updatedCount ? "  " : ""}`}
        </Button>
      </View>
    </View>
  );
}

export const videoListHeaderLeft = () => <HeaderLeftComp />;
export const videoListHeaderRight = () => <HeaderRightComp />;
export const videoListHeaderTitle = () => <HeaderTitleComp />;
