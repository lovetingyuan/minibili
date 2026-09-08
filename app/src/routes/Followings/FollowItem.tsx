import { useNavigation } from "@react-navigation/native";
import { Avatar, Badge, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import React from "react";
import { Alert, Linking, Pressable, TouchableOpacity, View } from "react-native";

import { colors } from "@/constants/colors.tw";
import { usePinnedUps } from "@/features/user-data/usePinnedUps";
import { useFollowActions } from "@/hooks/useFollowActions";

import { useStore } from "../../store";
import type { NavigationProps, UpInfo } from "../../types";
import { getImagePixelSize, getOriginalImgUrl, parseImgUrl } from "../../utils";

function FollowItem(props: { item: UpInfo; index?: number }) {
  // __DEV__ && console.log('follow item', props.item.name)
  const {
    item: { face, name, sign, mid },
    index,
  } = props;
  const { $upUpdateMap, set$upUpdateMap, livingUps, setOverlayButtons } = useStore();
  const actions = useFollowActions();
  const pins = usePinnedUps();
  const isPinned = pins.pinnedUpIds.includes(mid.toString());
  let hasUpdate = false;
  if ($upUpdateMap[mid]) {
    const { latestId, currentLatestId } = $upUpdateMap[mid];
    hasUpdate = latestId !== currentLatestId;
  }
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const gotoDynamic = () => {
    navigation.navigate("Dynamic", {
      user: {
        mid,
        face,
        name,
        sign,
      },
    });
  };
  const gotoLivePage = () => {
    const liveUrl = livingUps[mid];
    if (liveUrl) {
      navigation.navigate("Living", {
        url: liveUrl,
        title: `${name}的直播间`,
        user: { mid, name },
      });
    }
  };
  const buttons = () =>
    [
      hasUpdate
        ? {
            text: "标记为已读",
            onPress: () => {
              const update = $upUpdateMap[mid];
              set$upUpdateMap({
                ...$upUpdateMap,
                [mid]: {
                  latestId: update.currentLatestId,
                  currentLatestId: update.currentLatestId,
                },
              });
            },
          }
        : {
            text: "标记为未读",
            onPress: () => {
              if (mid in $upUpdateMap) {
                const update = $upUpdateMap[mid];
                set$upUpdateMap({
                  ...$upUpdateMap,
                  [mid]: {
                    latestId: Math.random().toString(),
                    currentLatestId: update.currentLatestId,
                  },
                });
              } else {
                set$upUpdateMap({
                  ...$upUpdateMap,
                  [mid]: {
                    latestId: Math.random().toString(),
                    currentLatestId: Math.random().toString(),
                  },
                });
                // showToast('请稍候再操作')
              }
            },
          },
      !actions.disabled && {
        text: "取消关注",
        onPress: () => {
          Alert.alert(`确定取消关注「${name}」吗？`, "", [
            { text: "关闭" },
            {
              text: "确定",
              onPress() {
                void actions.unfollow(props.item);
              },
            },
          ]);
        },
      },
      {
        text: "查看头像",
        onPress: () => {
          Linking.openURL(getOriginalImgUrl(face));
        },
      },
      pins.disabled || (isPinned && index === 0)
        ? null
        : {
            text: "置顶UP",
            onPress: () => {
              pins.pin(mid);
            },
          },
      !pins.disabled &&
        isPinned && {
          text: "取消置顶",
          onPress: () => {
            pins.unpin(mid);
          },
        },
      __DEV__ && {
        text: `${$upUpdateMap[mid]?.latestId} - ${$upUpdateMap[mid]?.currentLatestId}`,
        onPress: () => {},
      },
    ].filter((v) => !!v && typeof v === "object");

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onLongPress={() => {
        setOverlayButtons(buttons());
      }}
      className="mx-1 mb-6 flex-1 items-center"
      onPress={gotoDynamic}
    >
      <View className="relative">
        <Avatar
          size={48}
          rounded
          source={{
            uri: parseImgUrl(face, getImagePixelSize(48)),
          }}
        />
        {livingUps[mid] ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              gotoLivePage();
            }}
            className="absolute inset-0 h-12 w-12 items-center justify-center rounded-full bg-neutral-950/60"
          >
            <Text className={"text-center font-bold text-teal-300"}>直播中</Text>
          </Pressable>
        ) : null}
        {hasUpdate ? (
          <Badge
            key={mid}
            badgeClassName={`absolute left-[38px] top-[-45px] h-4 w-4 rounded-full ${colors.secondary.bg}`}
          />
        ) : null}
      </View>
      <UpName
        mid={mid}
        className={`
          flex-1 shrink-0 py-2 text-center text-sm
          ${isPinned ? `font-bold ${colors.primary.text}` : ""}
          ${hasUpdate ? colors.secondary.text : ""}
        `}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {name}
      </UpName>
    </TouchableOpacity>
  );
}

export default FollowItem;
