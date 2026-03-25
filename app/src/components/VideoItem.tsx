import { useNavigation } from "@react-navigation/native";
import { Icon, Text } from "@/components/styled/rneui";
import { Image } from "@/components/styled/expo";
import he from "he";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import WatchProgressBar from "@/components/WatchProgressBar";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import { useFollowedUpsMap } from "@/store/derives";
import type { CollectVideoInfo, HistoryVideoInfo, NavigationProps } from "@/types";
import {
  isDefined,
  parseDate,
  parseDuration,
  parseDurationStr,
  parseImgUrl,
  parseNumber,
} from "@/utils";

function extractTextWithEmTags(text: string, className?: string) {
  const regex = /<em class="keyword">(.*?)<\/em>|([^<]*)/g;
  const matches = text.matchAll(regex);
  const result: (React.ReactElement | string)[] = [];
  let i = 0;
  for (const match of matches) {
    const [, emContent, nonEmContent] = match;
    if (emContent) {
      result.push(
        <Text className={className} key={i++}>
          {he.decode(emContent)}
        </Text>,
      );
    } else if (nonEmContent.trim() !== "") {
      result.push(he.decode(nonEmContent));
    }
  }

  return result;
}

function VideoListItem<T extends CollectVideoInfo | HistoryVideoInfo>({
  video,
  buttons,
}: {
  video: T;
  buttons?: (vi: T) => {
    text: string;
    onPress: () => void;
  }[];
}) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { setOverlayButtons } = useStore();
  const _followedUpsMap = useFollowedUpsMap();
  const isFollowed = video.mid && video.mid in _followedUpsMap;
  const watchProgress =
    "watchProgress" in video ? Math.min(Math.max(video.watchProgress, 0), 100) : null;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={
        buttons
          ? () => {
              setOverlayButtons(buttons(video));
            }
          : undefined
      }
      onPress={() => {
        navigation.navigate("Play", {
          aid: video.aid,
          bvid: video.bvid,
          title: video.title,
          desc: video.desc,
          mid: video.mid,
          face: video.face,
          name: video.name,
          cover: video.cover,
          date: video.date,
          tag: video.tag,
        });
      }}
      className="mb-1 min-h-28 flex-row px-2 py-2"
    >
      <View className="mr-3 flex-[3]">
        <View className="relative aspect-8/5 w-full content-center justify-center">
          <Image
            className="h-full w-full rounded"
            source={{ uri: parseImgUrl(video.cover, 480, 300) }}
            placeholder={require("../../assets/video-loading.png")}
          />
          {watchProgress !== null ? <WatchProgressBar progress={watchProgress} /> : null}
          <View className="absolute right-0 top-0 m-1 rounded-sm bg-gray-900/70 px-1 py-[1px]">
            <Text className="text-xs font-thin text-white">
              {typeof video.duration === "string"
                ? parseDurationStr(video.duration)
                : parseDuration(video.duration)}
            </Text>
          </View>
          <View className="absolute top-0 m-1 rounded-sm bg-gray-900/70 px-1 py-[1px]">
            <Text className="text-xs font-thin text-white">{parseDate(video.date)}</Text>
          </View>
          {isDefined(video.danmaku) ? (
            <View
              className={`${watchProgress !== null ? "bottom-1.5" : "bottom-0"} absolute right-0 m-1 rounded-sm bg-gray-900/70 px-1 py-[1px]`}
            >
              <Text className="text-xs font-thin text-white">{parseNumber(video.danmaku)}弹</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View className="flex-[4] justify-between">
        <Text className="mb-3 flex-1 text-base" numberOfLines={2} ellipsizeMode="tail">
          {extractTextWithEmTags(video.title, colors.secondary.text)}
        </Text>
        <View className="gap-2">
          <Text className={isFollowed ? colors.secondary.text : colors.primary.text}>
            <Text className={colors.gray7.text}>UP: </Text>
            {video.name}
          </Text>
          {isDefined(video.play) ? (
            <View className="min-w-20 shrink-0 flex-row flex-wrap items-center gap-x-3">
              <View className="flex-row items-center gap-1">
                <Icon name="play-circle-outline" size={15} colorClassName={colors.gray6.accent} />
                <Text className={colors.gray6.text}>{parseNumber(video.play)}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Icon name="thumb-up-off-alt" colorClassName={colors.gray6.accent} size={15} />
                <Text className={colors.gray6.text}>{parseNumber(video.like)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default VideoListItem;
