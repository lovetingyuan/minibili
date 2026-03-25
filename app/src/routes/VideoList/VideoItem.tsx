import { Icon, Text } from "@/components/styled/rneui";
import { clsx } from "clsx";
import { Image } from "@/components/styled/expo";
import React from "react";
import { View } from "react-native";

import type { VideoItem as VideoItemType } from "@/api/hot-videos";
import WatchProgressBar from "@/components/WatchProgressBar";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import { useFollowedUpsMap } from "@/store/derives";
import { parseDate, parseDuration, parseImgUrl, parseNumber } from "@/utils";

export default VideoItem;

function VideoItem({ video }: { video: VideoItemType }) {
  // __DEV__ && console.log('hot video', video.title);
  const playNum = parseNumber(video.playNum);
  const { isWiFi, $watchedVideos, $blackTags } = useStore();
  const _followedUpsMap = useFollowedUpsMap();

  const isFollowed = video.mid in _followedUpsMap;
  const watchedInfo = $watchedVideos[video.bvid];
  const isBlackTag = video.tag in $blackTags;
  // console.log(parseImgUrl(video.cover, 480, 300))
  return (
    <View className="flex-1">
      <View className="relative w-full">
        <Image
          className="aspect-8/5 w-full rounded"
          contentFit="cover"
          source={isWiFi ? parseImgUrl(video.cover, 480, 300) : parseImgUrl(video.cover, 320, 200)}
        />
        {watchedInfo ? <WatchProgressBar progress={watchedInfo.watchProgress} /> : null}
        <View className="absolute m-1 items-center rounded-sm bg-gray-900/70 px-1  py-0.5">
          <Text className="text-xs text-white">{parseDuration(video.duration)}</Text>
        </View>
        <View
          className={`${watchedInfo ? "bottom-1.5" : "bottom-0"} absolute m-1 items-center rounded-sm bg-gray-900/70 px-1  py-0.5`}
        >
          <Text className="text-xs text-white">{parseDate(video.date)}</Text>
        </View>
        <View className="absolute right-0 top-0 m-1 items-center rounded-sm bg-gray-900/70 px-1  py-0.5">
          <Text className="text-xs text-white">{parseNumber(video.danmuNum)}弹</Text>
        </View>
        {video.tag ? (
          <View
            className={`right-0 ${watchedInfo ? "bottom-1.5" : "bottom-0"} absolute m-1 items-center rounded-sm bg-gray-900/70 px-1 py-0.5`}
          >
            <Text className={clsx("text-xs text-white", isBlackTag && "line-through opacity-60")}>
              {video.tag}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-3 flex-1 justify-between">
        <Text
          className={clsx("leading-5", isFollowed && ["font-bold", colors.primary.text])}
          numberOfLines={2}
        >
          {video.title}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="shrink flex-row items-center">
            {isFollowed ? (
              <Icon
                size={15}
                name="checkbox-marked-circle-outline"
                type="material-community"
                colorClassName={colors.secondary.accent}
              />
            ) : (
              <Icon
                size={15}
                name="account-circle-outline"
                type="material-community"
                colorClassName={colors.primary.accent}
              />
            )}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className={clsx(
                "ml-1 shrink grow text-xs",
                isFollowed ? ["font-bold", colors.secondary.text] : colors.primary.text,
              )}
            >
              {video.name}
            </Text>
          </View>
          <View className="shrink-0 flex-row items-center">
            <Icon
              size={15}
              name="play-circle-outline"
              type="material-community"
              colorClassName="accent-gray-600 dark:accent-gray-400"
            />
            <Text className="ml-1 text-xs text-gray-600 dark:text-gray-400">{playNum}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
