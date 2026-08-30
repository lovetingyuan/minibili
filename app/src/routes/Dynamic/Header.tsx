import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar, Icon, Text } from "@/components/styled/rneui";
import { clsx } from "clsx";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Linking, Pressable, View } from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "@/components/Menu";

import { colors } from "@/constants/colors.tw";
import { useFollowActions } from "@/hooks/useFollowActions";
import { useFollowedUpsMap } from "@/store/derives";

import { useLivingInfo } from "../../api/living-info";
import { useUserInfo } from "../../api/user-info";
import { useStore } from "../../store";
import type { NavigationProps, RootStackParamList } from "../../types";
import { handleShareUp, parseImgUrl, showToast } from "../../utils";

export function HeaderLeft() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Dynamic">["route"]>();
  const { data: userInfo } = useUserInfo(route.params?.user.mid);
  const { livingUrl } = useLivingInfo(route.params?.user.mid);
  const dynamicUser = {
    ...route.params?.user,
    ...userInfo,
  };
  // const { data: fans } = useUserRelation(dynamicUser?.mid)
  const navigation = useNavigation<NavigationProps["navigation"]>();
  // const gotoWebPage = () => {
  //   if (dynamicUser) {
  //     navigation.navigate('WebPage', {
  //       url: `https://space.bilibili.com/${dynamicUser.mid}`,
  //       title: `${dynamicUser.name}的主页`,
  //     })
  //   }
  // }
  // const level = dynamicUser?.level ? levelList[dynamicUser.level] : ''
  const userName = dynamicUser?.name || ""; // ? dynamicUser.name + level : ''
  // const sex =
  //   dynamicUser?.sex === '男' ? '♂️' : dynamicUser?.sex === '女' ? '♀️' : ''
  const { setCheckLiveTimeStamp } = useStore();
  const _followedUpsMap = useFollowedUpsMap();
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap;
  return (
    <View className="left-[-12px] mr-4 flex-none flex-row items-center">
      {dynamicUser?.face ? (
        <View className="relative">
          <Avatar
            size={40}
            rounded
            // onPress={gotoWebPage}
            source={{
              uri: parseImgUrl(dynamicUser.face, 120),
            }}
          />
          {dynamicUser.mid && livingUrl ? (
            <Pressable
              onPress={() => {
                if (dynamicUser.mid) {
                  setCheckLiveTimeStamp(Date.now());
                  navigation.navigate("Living", {
                    title: `${dynamicUser.name}的直播间`,
                    url: livingUrl,
                  });
                }
              }}
              className="absolute inset-0 h-10 w-10 items-center justify-center rounded-full bg-neutral-950/60"
            >
              <Text className={"text-center text-xs font-bold text-teal-300"}>直播中</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="ml-3 flex-1 flex-row flex-wrap items-center">
        <Text
          className={clsx(followed && [colors.secondary.text, "font-bold"], "text-lg")}
          // adjustsFontSizeToFit
          numberOfLines={1}
        >
          {userName}
        </Text>
        {/* {fans ? (
          <Text
            className="text-sm text-gray-500 dark:text-gray-400"
            onPress={() => {
              showToast(`粉丝：${fans.follower}`)
            }}>
            {parseNumber(fans.follower)}粉丝
          </Text>
        ) : null} */}
      </View>
    </View>
  );
}

export const headerRight = () => <HeaderRight />;
export const headerTitle = () => <HeaderLeft />;

function HeaderRight() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Dynamic">["route"]>();
  const dynamicUser = route.params?.user;
  const [visible, setVisible] = React.useState(false);
  const hideMenu = () => setVisible(false);
  const showMenu = () => setVisible(true);
  const {
    setReloadUerProfile,
    // setDynamicOpenUrl,
  } = useStore();
  const actions = useFollowActions();
  const _followedUpsMap = useFollowedUpsMap();
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap;
  return (
    <View className="flex-row items-center gap-2">
      <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
        <MenuTrigger onPress={showMenu}>
          <Icon name="dots-vertical" type="material-community" />
        </MenuTrigger>
        <MenuOptions>
          {!followed && (
            <MenuOption
              text={
                actions.isPreparing
                  ? "同步关注列表中"
                  : actions.pendingMid
                    ? "关注处理中"
                    : "关注UP"
              }
              disabled={actions.disabled}
              onSelect={() => {
                if (dynamicUser) {
                  void actions.follow(dynamicUser);
                }
                hideMenu();
              }}
            />
          )}
          <MenuOption
            text="分享UP"
            onSelect={() => {
              if (dynamicUser) {
                const { name, mid, sign } = dynamicUser;
                handleShareUp(name, mid, sign);
              }
              hideMenu();
            }}
          />
          <MenuOption
            text="查看头像"
            onSelect={() => {
              if (dynamicUser?.face) {
                Linking.openURL(dynamicUser.face);
              }
              hideMenu();
            }}
          />
          <MenuOption
            text="复制用户名"
            onSelect={() => {
              if (!dynamicUser) {
                return;
              }
              Clipboard.setStringAsync(dynamicUser.name).then(() => {
                showToast("已复制用户名");
                hideMenu();
              });
            }}
          />
          <MenuOption
            text="复制用户ID"
            onSelect={() => {
              if (!dynamicUser) {
                return;
              }
              Clipboard.setStringAsync(`${dynamicUser.mid}`).then(() => {
                showToast("已复制用户ID");
                hideMenu();
              });
            }}
          />
          <MenuOption
            text="浏览器打开"
            onSelect={() => {
              if (!dynamicUser) {
                return;
              }
              Linking.openURL(`https://space.bilibili.com/${dynamicUser.mid}`);
              // setDynamicOpenUrl(Date.now())
              hideMenu();
            }}
          />
          <MenuOption
            text="刷新"
            onSelect={() => {
              hideMenu();
              setReloadUerProfile(Date.now());
            }}
          />
        </MenuOptions>
      </Menu>
    </View>
  );
}
