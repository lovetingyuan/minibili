import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@/components/styled/rneui";
import React from "react";
import { Alert, TouchableOpacity } from "react-native";

import type { VideoItem as VideoItemType } from "@/api/hot-videos";
import { overlayIcons } from "@/constants/overlay-icons";
import { useBlockUpActions } from "@/hooks/useBlockUpActions";
import { useWatchLaterActions } from "@/hooks/useWatchLaterActions";
import { useStore } from "@/store";
import { useUserSettings } from "@/features/user-data/useUserSettings";
import type { MainTabNavigationProp } from "@/types";
import { handleShareVideo, parseNumber } from "@/utils";
import type { FlashListRef } from "@/components/styled/rneui";

import Loading from "./Loading";
import VideoItem from "./VideoItem";

type Footer = React.ReactElement | null | undefined;

function VideoList(props: {
  videos: VideoItemType[];
  type: "Hot" | "Rank" | "Search";
  footer?: Footer | ((l: VideoItemType[]) => Footer);
  onReachEnd?: () => void;
  onRefresh?: () => void;
  onTabReselect?: () => void;
  isRefreshing?: boolean;
}) {
  const { setOverlayButtons, currentVideosCate, setImagesList, setCurrentImageIndex } = useStore();
  const {
    values: { $blackTags },
    setSetting,
  } = useUserSettings();
  const { confirmBlock } = useBlockUpActions();
  const watchLater = useWatchLaterActions();
  const videoList: VideoItemType[] = [];
  const uniqVideosMap: Record<string, boolean> = {};
  for (const item of props.videos) {
    let needShow = !(item.bvid in uniqVideosMap);
    if (needShow && props.type === "Hot" && Object.hasOwn($blackTags, item.tag)) {
      needShow = false;
    }
    if (needShow) {
      uniqVideosMap[item.bvid] = true;
      videoList.push(item);
    }
  }

  const navigation = useNavigation<MainTabNavigationProp>();
  const listRef = React.useRef<FlashListRef<VideoItemType> | null>(null);
  const currentVideoRef = React.useRef<VideoItemType | null>(null);
  const { onTabReselect, type } = props;
  React.useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
    return () => clearTimeout(timer);
  }, [currentVideosCate]);
  React.useEffect(() => {
    if (type !== "Hot" || !onTabReselect) {
      return;
    }

    return navigation.addListener("tabPress", () => {
      if (!navigation.isFocused()) {
        return;
      }
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      onTabReselect();
    });
  }, [navigation, onTabReselect, type]);
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return;
    }
    const { tag } = currentVideoRef.current;
    Alert.alert(`不再看 ${tag} 类型的视频？`, "", [
      {
        text: "取消",
        style: "cancel",
      },
      {
        text: "确定",
        onPress: () => {
          setSetting("$blackTags", (previous) => ({ ...previous, [tag]: tag }));
        },
      },
    ]);
  };
  const gotoPlay = (data: VideoItemType) => {
    navigation.navigate("Play", {
      aid: data.aid,
      bvid: data.bvid,
      title: data.title,
      desc: data.desc,
      mid: data.mid,
      face: data.face,
      name: data.name,
      cover: data.cover,
      date: data.date,
      tag: data.tag,
      // video: data,
    });
  };
  const renderItem = (props: { index: number; item: VideoItemType }) => {
    const { item, index } = props;
    const blank = index % 2 ? "ml-1.5 mr-2" : "ml-2 mr-1.5";
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className={`mb-6 flex-1 self-stretch ${blank}`}
        key={item.bvid}
        onPress={() => gotoPlay(item)}
        onLongPress={() => {
          currentVideoRef.current = item;
          setOverlayButtons(buttons(item));
        }}
      >
        <VideoItem video={item} />
      </TouchableOpacity>
    );
  };
  const buttons = (video: VideoItemType) =>
    [
      {
        text: watchLater.isAdded(video.aid) ? "从稍后再看移除" : "添加到稍后再看",
        icon: watchLater.isAdded(video.aid)
          ? overlayIcons.removeWatchLater
          : overlayIcons.addWatchLater,
        onPress: () => {
          void watchLater.toggle({ aid: video.aid });
        },
      },
      {
        text: `拉黑 UP 主「${video.name}」`,
        icon: overlayIcons.blockUp,
        onPress: () => confirmBlock({ mid: video.mid, name: video.name }),
      },
      props.type === "Hot" && {
        text: `不再看「${currentVideoRef.current?.tag}」类型的视频`,
        icon: overlayIcons.hideTagType,
        onPress: addBlackTagName,
      },
      {
        text: `分享(${parseNumber(currentVideoRef.current?.shareNum)})`,
        icon: overlayIcons.share,
        onPress: () => {
          if (currentVideoRef.current) {
            const { name, title, bvid } = currentVideoRef.current;
            handleShareVideo(name, title, bvid);
          }
        },
      },
      {
        text: "查看封面",
        icon: overlayIcons.viewCover,
        onPress: () => {
          setCurrentImageIndex(0);
          setImagesList([
            {
              src: video.cover,
              width: video.width,
              height: video.height,
            },
          ]);
        },
      },
    ].filter((v) => v && typeof v === "object");
  const refreshProps = props.onRefresh
    ? {
        onRefresh: props.onRefresh,
        refreshing: props.isRefreshing,
      }
    : null;
  const reachEndProps = props.onReachEnd
    ? {
        onEndReached: props.onReachEnd,
        onEndReachedThreshold: 0.5,
      }
    : null;
  return (
    <FlashList
      ref={(v) => {
        listRef.current = v;
      }}
      numColumns={2}
      data={videoList}
      renderItem={renderItem}
      persistentScrollbar
      ListEmptyComponent={<Loading />}
      ListFooterComponent={
        typeof props.footer === "function" ? props.footer(videoList) : props.footer
      }
      contentContainerClassName="px-1 pt-6"
      {...refreshProps}
      {...reachEndProps}
    />
  );
}

export default VideoList;
