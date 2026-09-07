import { useNavigation } from "@react-navigation/native";
import type { ReactNode } from "react";
import { Linking, Pressable, useWindowDimensions, View } from "react-native";
import type { GestureResponderEvent } from "react-native";

import type { DynamicAuthor, DynamicContent, DynamicImage } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { getImagePixelDimensions, parseImgUrl, parseNumber } from "@/utils";

import { Image } from "../styled/expo";
import { Icon, Text } from "../styled/rneui";

function DynamicImageGrid(props: { images: DynamicImage[]; detail?: boolean }) {
  const { setImagesList, setCurrentImageIndex } = useStore();
  const { width: windowWidth } = useWindowDimensions();
  const visibleImages = props.detail ? props.images : props.images.slice(0, 9);
  const columns =
    visibleImages.length === 1
      ? 1
      : visibleImages.length === 2 || visibleImages.length === 4
        ? 2
        : 3;
  const widthClass = columns === 1 ? "w-full" : columns === 2 ? "w-[49%]" : "w-[32%]";
  const imageLayoutWidth = (windowWidth * 0.9) / columns;

  return (
    <View className="mb-3 flex-row flex-wrap gap-[1%] gap-y-1.5 overflow-hidden rounded-lg">
      {visibleImages.map((image, index) => {
        const aspectRatio = columns === 1 ? Math.max(0.55, Math.min(image.ratio, 1.8)) : 1;
        const requestSize = getImagePixelDimensions(
          imageLayoutWidth,
          imageLayoutWidth / aspectRatio,
          image.width,
          image.height,
        );

        return (
          <Pressable
            key={`${image.src}-${index}`}
            className={widthClass}
            onPress={() => {
              setImagesList(props.images);
              setCurrentImageIndex(index);
            }}
          >
            <Image
              source={{ uri: parseImgUrl(image.src, requestSize) }}
              contentFit="cover"
              className={columns === 1 ? "w-full rounded-lg" : "aspect-square w-full"}
              style={columns === 1 ? { aspectRatio } : undefined}
            />
            {!props.detail && index === 8 && props.images.length > 9 ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <Text className="text-lg font-semibold text-white">+{props.images.length - 9}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function VideoCard(props: {
  content: Extract<DynamicContent, { kind: "video" }>;
  author: DynamicAuthor;
  detail?: boolean;
}) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { width: windowWidth } = useWindowDimensions();
  const { content, author } = props;
  const coverSize = getImagePixelDimensions(windowWidth * 0.9, (windowWidth * 0.9 * 9) / 16);

  function openVideo(event?: GestureResponderEvent) {
    if (!content.bvid) {
      return;
    }
    event?.stopPropagation();
    navigation.navigate("Play", {
      bvid: content.bvid,
      aid: content.aid,
      title: content.title,
      desc: content.description,
      cover: content.cover,
      mid: author.mid,
      name: author.name,
      face: author.face,
    });
  }

  const coverContent: ReactNode = (
    <>
      {content.cover ? (
        <Image
          source={{ uri: parseImgUrl(content.cover, coverSize) }}
          contentFit="cover"
          className="h-full w-full"
        />
      ) : null}
      <View className="absolute inset-0 items-center justify-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-black/55">
          <Icon name="play-arrow" type="material" size={30} color="white" />
        </View>
      </View>
      <View className="absolute bottom-1.5 left-2 flex-row gap-3 rounded bg-black/60 px-2 py-1">
        <Text className="text-xs text-white">{parseNumber(content.play)} 播放</Text>
        <Text className="text-xs text-white">{parseNumber(content.danmaku)} 弹幕</Text>
      </View>
      {content.duration ? (
        <Text className="absolute bottom-1.5 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {content.duration}
        </Text>
      ) : null}
    </>
  );
  const description = (
    <View className="gap-1 p-3">
      <Text className="text-base font-semibold" numberOfLines={2}>
        {content.title}
      </Text>
      {content.description ? (
        <Text className={`text-xs ${colors.gray6.text}`} numberOfLines={props.detail ? 4 : 2}>
          {content.description}
        </Text>
      ) : null}
    </View>
  );
  const containerClassName = "mb-3 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800";
  const coverClassName = "relative aspect-video w-full bg-neutral-200 dark:bg-neutral-700";

  if (props.detail) {
    return (
      <Pressable className={containerClassName} onPress={openVideo}>
        <View className={coverClassName}>{coverContent}</View>
        {description}
      </Pressable>
    );
  }

  return (
    <View className={containerClassName}>
      {content.bvid ? (
        <Pressable className={coverClassName} onPress={openVideo}>
          {coverContent}
        </Pressable>
      ) : (
        <View className={coverClassName}>{coverContent}</View>
      )}
      {description}
    </View>
  );
}

function LinkCard(props: {
  content: Exclude<DynamicContent, { kind: "video" | "images" | "text" }>;
}) {
  const { content } = props;
  const coverSize = getImagePixelDimensions(96, 80);
  if (content.kind === "unavailable") {
    return (
      <View className="mb-3 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
        <Text className={colors.gray6.text}>{content.message}</Text>
      </View>
    );
  }
  return (
    <Pressable
      disabled={!content.url}
      onPress={() => content.url && void Linking.openURL(content.url)}
      className="mb-3 flex-row overflow-hidden rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800"
    >
      {content.cover ? (
        <Image
          source={{ uri: parseImgUrl(content.cover, coverSize) }}
          contentFit="cover"
          className="mr-3 h-20 w-24 rounded-md"
        />
      ) : null}
      <View className="min-w-0 flex-1 justify-center gap-1">
        {"label" in content && content.label ? (
          <Text className={`text-xs ${colors.secondary.text}`}>{content.label}</Text>
        ) : null}
        <Text className="text-sm font-semibold" numberOfLines={2}>
          {content.title}
        </Text>
        {content.description ? (
          <Text className={`text-xs ${colors.gray6.text}`} numberOfLines={3}>
            {content.description}
          </Text>
        ) : null}
        {content.kind === "article" && content.hasMore ? (
          <Text className={`text-xs ${colors.primary.text}`}>查看全文</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DynamicMedia(props: {
  content: DynamicContent;
  author: DynamicAuthor;
  detail?: boolean;
}) {
  if (props.content.kind === "images") {
    return <DynamicImageGrid images={props.content.images} detail={props.detail} />;
  }
  if (props.content.kind === "video") {
    return <VideoCard content={props.content} author={props.author} detail={props.detail} />;
  }
  if (props.content.kind === "text") {
    return null;
  }
  return <LinkCard content={props.content} />;
}
