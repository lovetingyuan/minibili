import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import React from "react";
import { Alert, View } from "react-native";

import { Avatar, Button, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import type { MainTabNavigationProp } from "@/types";
import { getImagePixelSize, parseImgUrl, parseNumber, showToast } from "@/utils";

export const headerRight = () => <AuthButton />;
export const headerTitle = () => <MineHeaderTitle />;

function AuthButton() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const { account, control, isChecking, logout } = useBilibiliSession();
  const loggingOut = control.phase === "logging-out";

  async function handleLogout() {
    try {
      await logout();
      showToast("已退出登录");
    } catch {
      showToast("退出登录失败，请重试；B站数据和云端设置未删除");
    }
  }

  function onPress() {
    if (isChecking || loggingOut) {
      showToast("正在确认登录状态，请稍候重试");
      return;
    }
    if (!account) {
      navigation.navigate("Followings");
      return;
    }
    Alert.alert(
      "退出登录",
      "仅退出本 App 的 B站登录，不删除 B站数据和云端设置。退出后使用游客设置，待同步修改保留在原账号下。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "退出",
          style: "destructive",
          onPress: () => {
            void handleLogout();
          },
        },
      ],
    );
  }

  return (
    <Button
      type="clear"
      size="sm"
      containerClassName="mr-2"
      loading={isChecking || loggingOut}
      onPress={onPress}
    >
      {account ? "退出" : "登录"}
    </Button>
  );
}

function MineHeaderTitle() {
  const { account } = useBilibiliSession();

  if (!account) {
    return (
      <Text className={clsx(colors.gray8.text, "text-lg")} numberOfLines={1}>
        我的
      </Text>
    );
  }

  const { face, follower, name } = account.profile;
  return (
    <View className="flex-row items-center">
      <Avatar
        rounded
        size={36}
        source={{
          uri: parseImgUrl(face, getImagePixelSize(36)),
        }}
      />
      <View className="ml-2 shrink">
        <Text className={clsx(colors.gray8.text, "text-base")} numberOfLines={1}>
          {name}
        </Text>
        {follower != null ? (
          <Text className={clsx(colors.gray6.text, "text-xs")} numberOfLines={1}>
            {parseNumber(follower)}粉丝
          </Text>
        ) : null}
      </View>
    </View>
  );
}
