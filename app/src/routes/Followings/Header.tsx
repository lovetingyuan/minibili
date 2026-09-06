import { useNavigation } from "@react-navigation/native";
import { Avatar, Button, Icon, Text } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";

import { colors } from "@/constants/colors.tw";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { getImagePixelSize, parseImgUrl, parseNumber } from "@/utils";

import type { NavigationProps } from "../../types";

export function HeaderTitle() {
  const { account, control } = useBilibiliSession();
  const profile =
    control.phase === "ready" && account?.generation === control.generation
      ? account.profile
      : null;

  if (!profile) {
    return <Text className={`text-lg ${colors.gray8.text}`}>登录 B站</Text>;
  }

  return (
    <View className="max-w-full flex-row items-center gap-2">
      <Avatar
        key={`${profile.mid}:${profile.face}`}
        size={32}
        rounded
        title={Array.from(profile.name)[0] || "B"}
        titleClassName={colors.gray8.text}
        containerClassName={`shrink-0 ${colors.gray2.bg}`}
        source={
          profile.face ? { uri: parseImgUrl(profile.face, getImagePixelSize(32)) } : undefined
        }
      />
      <Text
        className={`shrink text-lg ${colors.gray8.text}`}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {profile.name}
      </Text>
      {profile.follower !== undefined ? (
        <Text className={`shrink-0 text-xs ${colors.gray6.text}`} numberOfLines={1}>
          {parseNumber(profile.follower)}粉丝
        </Text>
      ) : null}
    </View>
  );
}

export function HeaderRight() {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  return (
    <View className="flex-row items-center gap-1">
      <Button
        radius={"sm"}
        type="clear"
        accessibilityLabel="关于"
        onPress={() => {
          navigation.navigate("About");
        }}
      >
        <Icon name="snow" type="ionicon" size={20} colorClassName={colors.primary.accent} />
      </Button>
    </View>
  );
}

export const followHeaderTitle = () => <HeaderTitle />;

export const followHeaderRight = () => {
  return <HeaderRight />;
};
