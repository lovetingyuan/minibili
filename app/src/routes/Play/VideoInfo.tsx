import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Avatar, Icon, Text } from "@/components/styled/rneui";
import React from "react";
import { Linking, Pressable, View } from "react-native";

import { useWatchingCount } from "@/api/watching-count";
import { colors } from "@/constants/colors.tw";
import type { NavigationProps, RootStackParamList } from "@/types";
import { getImagePixelSize, handleShareVideo, parseDate, parseImgUrl, parseNumber } from "@/utils";

import { useVideoInfo } from "../../api/video-info";
import { getVideoDescription } from "./description";
import FavoriteButton from "./FavoriteButton";
import LikeButton from "./LikeButton";
import VideoDescription from "./VideoDescription";
import VideoPagesSheet from "./VideoPagesSheet";
import { formatVideoPageTitle } from "./video-pages-sheet.helpers";

export default VideoInfo;

function VideoInfo(props: { currentPage: number; setCurrentPage: (p: number) => void }) {
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const { data, isLoading } = useVideoInfo(route.params.bvid);
  const videoInfo = {
    ...route.params,
    ...data,
  };
  const { name, face, mid, date, title, desc, pages } = videoInfo;
  const videoDesc = getVideoDescription(desc, title);
  const [showPagesModal, setShowPagesModal] = React.useState(false);

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const watchingCount = useWatchingCount(videoInfo.bvid, videoInfo.cid);
  return (
    <View>
      {videoInfo?.argument ? (
        <View className="mb-3 self-start rounded-lg bg-orange-50 px-2.5 py-2 dark:bg-orange-950/30">
          <Text
            className={`text-sm ${colors.warning.text}`}
            onPress={() => {
              if (videoInfo.argumentLink) {
                Linking.openURL(videoInfo.argumentLink);
              }
            }}
          >
            ⚠️ {videoInfo.argument}
          </Text>
        </View>
      ) : null}

      <View className="mb-3 w-full flex-row justify-between">
        <Pressable
          onPress={() => {
            if (!mid || !face || !name) {
              return;
            }
            const user = {
              mid,
              face,
              name,
              sign: "-",
            };
            navigation.push("Dynamic", { user });
          }}
          className="mr-1 min-w-0 flex-1 flex-row items-center"
        >
          {face ? (
            <Avatar
              size={36}
              containerClassName="shrink-0"
              rounded
              source={{ uri: parseImgUrl(face, getImagePixelSize(36)) }}
            />
          ) : (
            <View className={`h-9 w-9 shrink-0 rounded-full ${colors.gray3.bg}`} />
          )}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="ml-3 mr-1 min-w-0 flex-1 text-base font-bold"
          >
            {name || ""}
          </Text>
        </Pressable>
        <View className="ml-1 flex-none flex-row items-center gap-1 px-2">
          <Icon name="date-range" size={16} colorClassName={colors.gray6.accent} />
          <Text className={`text-sm ${colors.gray6.text}`}>{parseDate(date, true)}</Text>
          <Text className={`ml-1 text-sm ${colors.gray6.text}`}>
            {watchingCount
              ? `${watchingCount.total === "1" ? "壹" : watchingCount.total}人在看`
              : " "}
          </Text>
        </View>
      </View>

      <Text selectable className={`text-lg font-bold leading-6 ${colors.gray9.text}`}>
        {title}
      </Text>

      {pages && pages.length > 1 ? (
        <View className="mt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="打开分P列表"
            android_ripple={{ color: "transparent" }}
            className="flex-row items-center gap-2.5 rounded-2xl bg-neutral-100 px-3 py-2 dark:bg-neutral-900"
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
            onPress={() => {
              setShowPagesModal(true);
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/50">
              <Icon name="playlist-play" size={21} colorClassName={colors.primary.accent} />
            </View>
            <Text className="min-w-0 flex-1 text-base" numberOfLines={1} ellipsizeMode="tail">
              {formatVideoPageTitle(
                pages[props.currentPage - 1].title,
                pages[props.currentPage - 1].page,
              )}
            </Text>
            <Text className={`shrink-0 text-sm tabular-nums ${colors.gray6.text}`}>
              {`P${props.currentPage}/${pages.length}`}
            </Text>
            <Icon name="chevron-right" size={22} colorClassName={colors.gray6.accent} />
          </Pressable>
          <VideoPagesSheet
            currentPage={props.currentPage}
            pages={pages}
            visible={showPagesModal}
            onClose={() => {
              setShowPagesModal(false);
            }}
            onSelectPage={props.setCurrentPage}
          />
        </View>
      ) : null}

      <VideoDescription text={videoDesc} nodes={videoInfo.descriptionNodes} />

      <View className="mt-3 flex-row items-center rounded-xl bg-neutral-50 px-1 py-2 dark:bg-neutral-900">
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1">
          <Icon name="play-circle-outline" size={18} colorClassName={colors.gray8.accent} />
          <Text selectable className={`text-xs tabular-nums ${colors.gray8.text}`}>
            {parseNumber(videoInfo?.playNum)}
          </Text>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1">
          <Icon name="chat-bubble-outline" size={17} colorClassName={colors.gray8.accent} />
          <Text selectable className={`text-xs tabular-nums ${colors.gray8.text}`}>
            {parseNumber(videoInfo?.danmuNum)}
          </Text>
        </View>
        <LikeButton aid={videoInfo.aid} bvid={videoInfo.bvid} count={videoInfo.likeNum} />
        <FavoriteButton aid={videoInfo.aid} bvid={videoInfo.bvid} count={videoInfo.collectNum} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`分享视频，分享数 ${videoInfo.shareNum ?? "加载中"}`}
          className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1"
          hitSlop={6}
          onPress={() => {
            if (name && title && route.params.bvid) {
              handleShareVideo(name, title, route.params.bvid, props.currentPage);
            }
          }}
        >
          <Icon
            type="material-community"
            name="share-variant-outline"
            size={19}
            colorClassName={colors.gray8.accent}
          />
          <Text selectable className={`text-xs tabular-nums ${colors.gray8.text}`}>
            {parseNumber(videoInfo?.shareNum)}
          </Text>
        </Pressable>
      </View>

      {!isLoading && videoInfo?.interactive ? (
        <Text className={`mt-3 italic ${colors.warning.text}`}>【该视频为交互视频，暂不支持】</Text>
      ) : null}
    </View>
  );
}
