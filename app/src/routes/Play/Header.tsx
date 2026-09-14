import { type RouteProp, useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { clsx } from "clsx";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Linking, View } from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "@/components/Menu";

import { getDownloadUrl } from "@/api/play-url";
import { useUserRelation } from "@/api/user-relation";
import { useVideoInfo } from "@/api/video-info";
import { colors } from "@/constants/colors.tw";
import { useWatchLaterActions } from "@/hooks/useWatchLaterActions";
import { useStore } from "@/store";
import { useFollowedUpsMap } from "@/store/derives";
import type { RootStackParamList } from "@/types";
import { parseNumber, showToast } from "@/utils";

export function PlayHeaderTitle() {
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const { data: vi } = useVideoInfo(route.params.bvid);
  const { data: fans } = useUserRelation(route.params?.mid || vi?.mid);
  const _followedUpsMap = useFollowedUpsMap();
  const followed = route.params?.mid && route.params.mid in _followedUpsMap;
  return (
    <View className="relative left-[-10px] flex-row items-center">
      <UpName
        mid={route.params?.mid || vi?.mid}
        className={clsx("text-lg font-semibold", followed && colors.secondary.text)}
      >
        {route.params?.name || vi?.name}
      </UpName>
      <Text
        className="ml-3 text-gray-500 dark:text-gray-400"
        onPress={() => {
          if (fans) {
            showToast(`粉丝：${fans.follower}`);
          }
        }}
      >
        {` ${fans?.follower ? parseNumber(fans.follower) : ""}粉丝`}
      </Text>
    </View>
  );
}

export function PlayHeaderRight(props: { cid?: number }) {
  const [visible, setVisible] = React.useState(false);
  const hideMenu = () => setVisible(false);
  const showMenu = () => setVisible(true);
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Play">["route"]>();
  const { data } = useVideoInfo(route.params.bvid);
  const watchLater = useWatchLaterActions();
  const { setImagesList, setCurrentImageIndex } = useStore();
  const videoInfo = {
    ...route.params,
    ...data,
  };
  return (
    <View className="flex-row items-center gap-2">
      <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
        <MenuTrigger onPress={showMenu}>
          <Icon name="dots-vertical" type="material-community" />
        </MenuTrigger>
        <MenuOptions>
          <MenuOption
            text={watchLater.isAdded(videoInfo.aid) ? "从稍后再看移除" : "添加到稍后再看"}
            onSelect={() => {
              hideMenu();
              void watchLater.toggle({ aid: videoInfo.aid });
            }}
          />
          <MenuOption
            text="下载视频"
            onSelect={() => {
              if (props.cid) {
                showToast("请稍后在浏览器中下载");
                getDownloadUrl(videoInfo.bvid, props.cid)
                  ?.then((url) => {
                    if (url) {
                      Linking.openURL(url);
                    } else {
                      return Promise.reject();
                    }
                  })
                  .catch(() => {
                    showToast("暂不支持下载");
                  });
              } else {
                showToast("稍后再试");
              }
              hideMenu();
            }}
          />
          <MenuOption
            text="查看封面"
            onSelect={() => {
              hideMenu();
              if (!videoInfo.cover) {
                showToast("暂时无法获取封面");
                return;
              }

              setImagesList([{ src: videoInfo.cover, width: 0, height: 0, ratio: 16 / 9 }]);
              setCurrentImageIndex(0);
            }}
          />
          <MenuOption
            text="复制视频ID"
            onSelect={() => {
              Clipboard.setStringAsync(videoInfo.bvid).then(() => {
                showToast(`已复制视频ID：${videoInfo.bvid}`);
                hideMenu();
              });
            }}
          />
        </MenuOptions>
      </Menu>
    </View>
  );
}
