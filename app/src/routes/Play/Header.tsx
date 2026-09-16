import { type RouteProp, useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { clsx } from "clsx";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { View } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  menuTriggerIconButtonStyles,
} from "@/components/Menu";

import { useUserRelation } from "@/api/user-relation";
import { useVideoInfo } from "@/api/video-info";
import { colors } from "@/constants/colors.tw";
import { isDownloadingVideo } from "@/features/video-download/controller";
import { useVideoDownload } from "@/features/video-download/useVideoDownload";
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

export function PlayHeaderRight(props: { cid?: number; page?: number; pageTitle?: string }) {
  const [visible, setVisible] = React.useState(false);
  const hideMenu = () => setVisible(false);
  const showMenu = () => setVisible(true);
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Play">["route"]>();
  const { data } = useVideoInfo(route.params.bvid);
  const watchLater = useWatchLaterActions();
  const { setImagesList, setCurrentImageIndex } = useStore();
  const { task: downloadTask, start: startDownload, cancel: cancelDownload } = useVideoDownload();
  const videoInfo = {
    ...route.params,
    ...data,
  };
  const downloading = isDownloadingVideo(downloadTask, videoInfo.bvid ?? "", props.cid ?? 0);

  /**
   * 下载当前分P：地址解析阶段的失败原因即时用 toast 反馈，
   * 下载过程中的进度与结果由通知展示，这里不再等待。
   */
  async function handleDownloadVideo() {
    if (!props.cid) {
      showToast("稍后再试");
      return;
    }
    const result = await startDownload({
      bvid: videoInfo.bvid ?? "",
      cid: props.cid,
      title: videoInfo.title,
      page: props.page,
      pageTitle: props.pageTitle,
    });
    if (result === "busy") {
      showToast("已有下载任务进行中");
      return;
    }
    if (result === "unsupported") {
      showToast("暂不支持下载");
      return;
    }
    if (result === "failed") {
      showToast("下载失败，请稍后重试");
    }
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
            text={downloading ? "取消下载" : "下载视频"}
            onSelect={() => {
              hideMenu();
              if (downloading) {
                cancelDownload();
                return;
              }
              void handleDownloadVideo();
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
