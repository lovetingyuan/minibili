import { useNavigation } from "@react-navigation/native";
import { Avatar, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { Alert, Linking, Pressable, TouchableOpacity, View } from "react-native";

import { useFollowActions } from "@/hooks/useFollowActions";

import { useStore } from "../../store";
import type { NavigationProps, UpInfo } from "../../types";
import { getImagePixelSize, getOriginalImgUrl, parseImgUrl } from "../../utils";

type FollowItemProps = {
  item: UpInfo;
  onSetGroups?: (up: UpInfo) => void;
};

function FollowItem({ item, onSetGroups }: FollowItemProps) {
  const { face, name, sign, mid } = item;
  const { livingUps, setOverlayButtons } = useStore();
  const actions = useFollowActions();
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
      onSetGroups && {
        text: "设置分组",
        onPress: () => {
          onSetGroups(item);
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
                void actions.unfollow(item);
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
      </View>
      <UpName
        mid={mid}
        className="flex-1 shrink-0 py-2 text-center text-sm"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {name}
      </UpName>
    </TouchableOpacity>
  );
}

export default FollowItem;
