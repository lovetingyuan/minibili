import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Linking, Pressable, useWindowDimensions, View } from "react-native";
import type { GestureResponderEvent } from "react-native";

import type { DynamicAuthor, DynamicContent, DynamicImage } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import { useWatchLaterActions } from "@/hooks/useWatchLaterActions";
import { useStore } from "@/store";
import { useWatchProgressRatio } from "@/store/watch-progress";
import type { NavigationProps } from "@/types";
import { getImagePixelDimensions, parseImgUrl, parseNumber } from "@/utils";

import { Image } from "../styled/expo";
import { Icon, Text } from "../styled/rneui";
import { WatchProgressBar } from "../WatchProgressBar";

/**
 * `natural` 用于专栏正文：单图按原比例完整显示，不做裁剪。
 */
export function DynamicImageGrid(props: {
  images: DynamicImage[];
  detail?: boolean;
  natural?: boolean;
}) {
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
        const aspectRatio =
          columns === 1
            ? props.natural
              ? Math.max(image.ratio, 0.05)
              : Math.max(0.55, Math.min(image.ratio, 1.8))
            : 1;
        const requestSize = getImagePixelDimensions(
          imageLayoutWidth,
          imageLayoutWidth / aspectRatio,
          image.width,
          image.height,
        );
        const source = props.natural
          ? parseImgUrl(image.src, { ...requestSize, crop: false })
          : parseImgUrl(image.src, requestSize);

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
              source={{ uri: source }}
              contentFit={props.natural ? "contain" : "cover"}
              className={clsx(
                columns === 1 ? "w-full rounded-lg" : "aspect-square w-full",
                props.natural && "bg-neutral-100 dark:bg-neutral-800",
              )}
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
  const { setOverlayButtons, setImagesList, setCurrentImageIndex } = useStore();
  const watchLater = useWatchLaterActions();
  const { content, author } = props;
  const progressRatio = useWatchProgressRatio(content.bvid);
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

  function openMenu(event?: GestureResponderEvent) {
    event?.stopPropagation();
    const buttons: { text: string; onPress: () => void }[] = [];
    if (content.bvid) {
      buttons.push({
        text: watchLater.isAdded(content.aid) ? "从稍后再看移除" : "添加到稍后再看",
        onPress: () => {
          void watchLater.toggle({ aid: content.aid });
        },
      });
    }
    if (content.cover) {
      buttons.push({
        text: "查看封面",
        onPress: () => {
          setImagesList([{ src: content.cover, width: 0, height: 0, ratio: 16 / 9 }]);
          setCurrentImageIndex(0);
        },
      });
    }
    if (buttons.length) {
      setOverlayButtons(buttons);
    }
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
        <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
          <Icon name="play-arrow" type="material" size={45} color="white" />
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
      <WatchProgressBar ratio={progressRatio} />
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
        <Pressable
          className={coverClassName}
          onLongPress={openMenu}
          onPress={openVideo}
        >
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
  // 专栏卡片的摘要已经在卡片上方作为动态正文展示，这里只保留标题和全文入口，
  // 同时用更宽的 16:9 缩略图，避免卡片又高又重复。
  const isArticle = content.kind === "article";
  const coverSize = isArticle ? getImagePixelDimensions(128, 72) : getImagePixelDimensions(96, 80);
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
          className={isArticle ? "mr-3 aspect-video w-32 rounded-md" : "mr-3 h-20 w-24 rounded-md"}
        />
      ) : null}
      <View className="min-w-0 flex-1 justify-center gap-1">
        {"label" in content && content.label ? (
          <Text className={`text-xs ${colors.secondary.text}`}>{content.label}</Text>
        ) : null}
        <Text className="text-sm font-semibold" numberOfLines={2}>
          {content.title}
        </Text>
        {!isArticle && content.description ? (
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
