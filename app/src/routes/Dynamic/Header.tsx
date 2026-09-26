import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import UpName from "@/components/UpName";
import { clsx } from "clsx";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { EllipsisVertical } from "lucide-react-native";
import { Pressable, View } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  menuTriggerIconButtonStyles,
} from "@/components/Menu";

import { useBilibiliBlacklist } from "@/api/useBilibiliBlacklist";
import { theme } from "@/constants/theme";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { useBlockUpActions } from "@/hooks/useBlockUpActions";
import { useFollowActions } from "@/hooks/useFollowActions";
import { useFollowedUpsMap } from "@/store/derives";

import { useLivingInfo } from "../../api/living-info";
import { useUserRelation } from "../../api/user-relation";
import { useUserInfo } from "../../api/user-info";
import { useStore } from "../../store";
import type { NavigationProps, RootStackParamList, UpInfo } from "../../types";
import { getImagePixelSize, handleShareUp, parseImgUrl, parseNumber, showToast } from "../../utils";

// 头像右上角的性别角标，只用性别符号本身，不加底色
const sexBadgeMap: Record<string, { symbol: string; textClassName: string; label: string }> = {
  男: { symbol: "♂", textClassName: theme.primary.text, label: "男性" },
  女: { symbol: "♀", textClassName: theme.secondary.text, label: "女性" },
};

/** 当前空间是否就是登录用户自己 */
function useIsSelfSpace(mid: UpInfo["mid"] | undefined) {
  const { account } = useBilibiliSessionState();
  return account != null && String(account.mid) === String(mid);
}

function HeaderLeft() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Dynamic">["route"]>();
  const { data: userInfo } = useUserInfo(route.params?.user.mid);
  const { livingUrl } = useLivingInfo(route.params?.user.mid);
  const dynamicUser = {
    ...route.params?.user,
    ...userInfo,
  };
  const isSelf = useIsSelfSpace(dynamicUser?.mid);
  const sexBadge = dynamicUser?.sex ? sexBadgeMap[dynamicUser.sex] : undefined;
  const { data: fans } = useUserRelation(dynamicUser?.mid);
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
  const _followedUpsMap = useFollowedUpsMap();
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap;
  const { setImagesList, setCurrentImageIndex } = useStore();

  const copyUserName = () => {
    if (!dynamicUser?.name) {
      return;
    }
    void Clipboard.setStringAsync(dynamicUser.name).then(() => {
      showToast(`已复制：${dynamicUser.name}`);
    });
  };

  const viewAvatar = () => {
    if (!dynamicUser?.face) {
      return;
    }
    setImagesList([{ src: dynamicUser.face, width: 0, height: 0, ratio: 1 }]);
    setCurrentImageIndex(0);
  };

  return (
    <View className="left-[-12px] mr-4 flex-none flex-row items-center">
      {dynamicUser?.face ? (
        <View className="relative">
          <Avatar
            size={40}
            rounded
            onPress={viewAvatar}
            source={{
              uri: parseImgUrl(dynamicUser.face, getImagePixelSize(40)),
            }}
          />
          {dynamicUser.mid && livingUrl ? (
            <Pressable
              onPress={() => {
                if (dynamicUser.mid) {
                  navigation.navigate("Living", {
                    title: `${dynamicUser.name}的直播间`,
                    user: { mid: dynamicUser.mid, name: userName },
                    url: livingUrl,
                  });
                }
              }}
              className="absolute inset-0 h-10 w-10 items-center justify-center rounded-full bg-slate-950/60"
            >
              <Text className={`text-center text-xs font-bold text-[#80DAF6]`}>直播中</Text>
            </Pressable>
          ) : null}
          {sexBadge ? (
            <View
              accessibilityLabel={sexBadge.label}
              className="absolute -top-1 -right-1 items-center justify-center"
            >
              <Text
                className={clsx(
                  "text-center text-sm font-bold leading-none",
                  sexBadge.textClassName,
                )}
              >
                {sexBadge.symbol}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="ml-3 flex-1 flex-row items-center">
        <UpName
          mid={dynamicUser.mid}
          className={clsx(
            "shrink text-lg",
            isSelf && theme.primary.text,
            followed && [theme.secondary.text, "font-bold"],
          )}
          // adjustsFontSizeToFit
          onPress={copyUserName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {userName}
        </UpName>
        {fans ? (
          <Text
            className="ml-2 shrink-0 text-sm text-gray-500 dark:text-gray-400"
            onPress={() => {
              showToast(`粉丝：${fans.follower}`);
            }}
          >
            {parseNumber(fans.follower)}粉丝
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const headerRight = () => <HeaderRight />;
export const headerTitle = () => <HeaderLeft />;

function HeaderRight() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Dynamic">["route"]>();
  const dynamicUser = route.params?.user;
  const isSelf = useIsSelfSpace(dynamicUser?.mid);
  const [visible, setVisible] = React.useState(false);
  const hideMenu = () => setVisible(false);
  const showMenu = () => setVisible(true);
  const actions = useFollowActions();
  const { confirmBlock } = useBlockUpActions();
  const { blacklist } = useBilibiliBlacklist();
  const _followedUpsMap = useFollowedUpsMap();
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap;
  const blocked = dynamicUser?.mid !== undefined && blacklist.has(String(dynamicUser.mid));
  const followOptionText = actions.isPreparing
    ? "同步关注列表中"
    : actions.pendingMid
      ? "关注处理中"
      : followed
        ? "取消关注"
        : "关注UP";

  // 自己的空间没有关注、拉黑等操作，整块菜单不展示
  if (isSelf) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-2">
      <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
        <MenuTrigger
          accessibilityRole="button"
          accessibilityLabel="更多操作"
          customStyles={menuTriggerIconButtonStyles}
          onPress={showMenu}
        >
          <ThemedIcon icon={EllipsisVertical} />
        </MenuTrigger>
        <MenuOptions>
          <MenuOption
            text={followOptionText}
            disabled={actions.disabled}
            onSelect={() => {
              hideMenu();
              if (!dynamicUser) {
                return;
              }
              if (followed) {
                actions.confirmUnfollow(dynamicUser);
                return;
              }
              void actions.follow(dynamicUser);
            }}
          />
          <MenuOption
            text={blocked ? "已拉黑" : "拉黑UP"}
            disabled={blocked}
            onSelect={() => {
              hideMenu();
              if (!blocked && dynamicUser) {
                confirmBlock({ mid: dynamicUser.mid, name: dynamicUser.name });
              }
            }}
          />
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
            text="复制ID"
            onSelect={() => {
              if (dynamicUser?.mid) {
                const mid = String(dynamicUser.mid);
                void Clipboard.setStringAsync(mid).then(() => {
                  showToast(`已复制：${mid}`);
                });
              }
              hideMenu();
            }}
          />
        </MenuOptions>
      </Menu>
    </View>
  );
}
