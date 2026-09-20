import { useNavigation } from "@react-navigation/native";
import { Avatar, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { clsx } from "clsx";
import { Alert, Pressable, TouchableOpacity, View } from "react-native";

import { colors } from "@/constants/colors.tw";
import { useFollowActions } from "@/hooks/useFollowActions";

import { useStore } from "../../store";
import { useUpHasNewDynamic } from "../../store/derives";
import type { NavigationProps, UpInfo } from "../../types";
import { getImagePixelSize, parseImgUrl } from "../../utils";

type FollowItemProps = {
  item: UpInfo;
  /** 特别关注的 UP：名称使用主题色并加粗 */
  highlight?: boolean;
  onSetGroups?: (up: UpInfo) => void;
};

function FollowItem({ item, highlight, onSetGroups }: FollowItemProps) {
  const { face, name, sign, mid } = item;
  const { livingUps, setOverlayButtons, setImagesList, setCurrentImageIndex } = useStore();
  const hasNewDynamic = useUpHasNewDynamic(mid);
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
          setCurrentImageIndex(0);
          setImagesList([{ src: face, width: 0, height: 0, ratio: 1 }]);
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
          size={52}
          rounded
          source={{
            uri: parseImgUrl(face, getImagePixelSize(52)),
          }}
        />
        {livingUps[mid] ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              gotoLivePage();
            }}
            className="absolute inset-0 h-[52px] w-[52px] items-center justify-center rounded-full bg-neutral-950/60"
          >
            <Text className={"text-center text-xs font-bold text-teal-300"}>直播中</Text>
          </Pressable>
        ) : null}
        {hasNewDynamic ? (
          <View
            className={clsx(
              "absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-neutral-900",
              colors.secondary.bg,
            )}
          />
        ) : null}
      </View>
      <UpName
        mid={mid}
        className={`flex-1 shrink-0 py-2 text-center text-sm ${
          highlight ? `font-bold ${colors.primary.text}` : ""
        }`}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {name}
      </UpName>
    </TouchableOpacity>
  );
}

export default FollowItem;
