import { useNavigation } from "@react-navigation/native";
import { FAB, FlashList, Icon } from "@/components/styled/rneui";
import React from "react";
import { Alert, Linking, TouchableOpacity } from "react-native";

import type { VideoItem as VideoItemType } from "@/api/hot-videos";
import { colors } from "@/constants/colors.tw";
import { useBlockUpActions } from "@/hooks/useBlockUpActions";
import { useStore } from "@/store";
import { useMarkVideoWatched } from "@/store/actions";
import type { NavigationProps } from "@/types";
import { handleShareVideo, parseNumber, parseUrl } from "@/utils";
import type { FlashListRef } from "@/components/styled/rneui";

import Loading from "./Loading";
import VideoItem from "./VideoItem";

type Footer = React.ReactElement | null | undefined;

function VideoList(props: {
  videos: VideoItemType[];
  type: "Hot" | "Rank" | "Search";
  footer?: Footer | ((l: VideoItemType[]) => Footer);
  onReachEnd?: () => void;
  onRefresh?: (fab?: boolean) => void;
  isRefreshing?: boolean;
}) {
  const { $blackTags, set$blackTags, setOverlayButtons, currentVideosCate } = useStore();
  const { confirmBlock } = useBlockUpActions();
  const videoList: VideoItemType[] = [];
  const uniqVideosMap: Record<string, boolean> = {};
  for (const item of props.videos) {
    let needShow = !(item.bvid in uniqVideosMap);
    if (needShow && props.type === "Hot" && item.tag in $blackTags) {
      needShow = false;
    }
    if (needShow) {
      uniqVideosMap[item.bvid] = true;
      videoList.push(item);
    }
  }

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const listRef = React.useRef<FlashListRef<VideoItemType> | null>(null);
  const currentVideoRef = React.useRef<VideoItemType | null>(null);
  const markVideoWatched = useMarkVideoWatched();
  React.useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [currentVideosCate]);
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return;
    }
    Alert.alert(`不再看 ${currentVideoRef.current.tag} 类型的视频？`, "", [
      {
        text: "取消",
        style: "cancel",
      },
      {
        text: "确定",
        onPress: () => {
          const { tag } = currentVideoRef.current!;
          set$blackTags({
            ...$blackTags,
            [tag]: tag,
          });
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
  const markWatched = () => {
    const videoInfo = currentVideoRef.current;
    if (!videoInfo) {
      return;
    }
    markVideoWatched(videoInfo, 100);
  };
  const buttons = (video: VideoItemType) =>
    [
      {
        text: `拉黑 UP 主「${video.name}」`,
        onPress: () => confirmBlock({ mid: video.mid, name: video.name }),
      },
      props.type === "Hot" && {
        text: `不再看「${currentVideoRef.current?.tag}」类型的视频`,
        onPress: addBlackTagName,
      },
      {
        text: `分享(${parseNumber(currentVideoRef.current?.shareNum)})`,
        onPress: () => {
          if (currentVideoRef.current) {
            const { name, title, bvid } = currentVideoRef.current;
            handleShareVideo(name, title, bvid);
          }
        },
      },
      {
        text: "标记观看完成",
        onPress: markWatched,
      },
      {
        text: "查看封面",
        onPress: () => {
          if (!currentVideoRef.current) {
            return;
          }
          Linking.openURL(parseUrl(currentVideoRef.current.cover));
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
    <>
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
      {props.type === "Hot" && (
        <FAB
          visible
          colorClassName={colors.secondary.accent}
          placement="right"
          icon={<Icon name="refresh" color="white" />}
          className="bottom-3 opacity-90"
          size="small"
          onPress={() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
            props.onRefresh?.(true);
          }}
        />
      )}
    </>
  );
}

export default VideoList;
