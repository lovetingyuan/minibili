import { Avatar, Button, Icon, Text } from "@/components/styled/rneui";
import { clsx } from "clsx";
import React from "react";
import { Share, View } from "react-native";

import { site } from "@/constants";
import { colors } from "@/constants/colors.tw";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { getImagePixelSize, parseImgUrl, parseNumber } from "@/utils";

export const headerRight = () => (
  <Button
    type="clear"
    size="sm"
    onPress={() => {
      Share.share({
        message: `MiniBili - 简单的B站浏览\n点击下载：${site}`,
      });
    }}
  >
    <Icon name="share" type="material-community" />
  </Button>
);

export const headerTitle = () => <MineHeaderTitle />;

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
