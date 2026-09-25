import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import * as Clipboard from "expo-clipboard";
import { Linking, Pressable, View } from "react-native";

import { Image } from "@/components/styled/expo";
import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseImgUrl, showToast } from "@/utils";

import type { CommentImageEntryProps, CommentTextProps } from "./comment.types";
import { CommentLikeEntry } from "./CommentLikeEntry";
import { InlineEmoji } from "../InlineEmoji";
import UpName from "../UpName";

/** 评论最多直接展示的缩略图张数，超出部分在第 3 张上叠加 +N */
const MAX_THUMBNAILS = 3;

/** 缩略图边长（dp）：一级评论 64，卡片内的回复预览 56 */
const THUMBNAIL_SIZE = 64;
const COMPACT_THUMBNAIL_SIZE = 56;

export function CommentText(props: CommentTextProps) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  // RNEUI 的 Text 在 Android 上会给每个文本节点加默认的 fontFamily/fontWeight，
  // 嵌套节点不会继承父级字重，所以加粗必须下发到每个节点。
  const boldClassName = props.bold ? "font-bold" : "";
  // 同理，UP 主觉得很赞的主题粉色也要下发到每个节点，避免原生端嵌套节点回落到默认文字色。
  const bodyTextClassName = `${props.creatorLiked ? theme.secondary.text : ""} ${boldClassName}`;
  const accentTextClassName = `${theme.primary.text} ${boldClassName}`;
  return (
    <Text className={`text-[15px] leading-6 ${bodyTextClassName}`}>
      {props.nodes.map((node, index) => {
        const key = `${props.idStr}:${index}`;
        if (node.type === "at") {
          return (
            <UpName
              mid={node.mid}
              key={key}
              className={accentTextClassName}
              onPress={() =>
                navigation.push("Dynamic", {
                  user: { face: "", name: node.text.slice(1), mid: node.mid, sign: "-" },
                })
              }
            >
              {node.text}
            </UpName>
          );
        }
        if (node.type === "url") {
          return (
            <Text
              key={key}
              className={accentTextClassName}
              onLongPress={() => {
                void Clipboard.setStringAsync(node.url).then(() => showToast("已复制链接"));
              }}
              onPress={() => void Linking.openURL(node.url)}
            >
              🔗 链接
            </Text>
          );
        }
        if (node.type === "emoji") {
          return <InlineEmoji key={key} url={node.url} size={18} fontSize={15} />;
        }
        if (node.type === "vote") {
          return (
            <Text
              key={key}
              className={accentTextClassName}
              onPress={() => node.url && void Linking.openURL(node.url)}
            >
              {`🗳️ ${node.text || "投票"}`}
            </Text>
          );
        }
        if (node.type === "av") {
          return (
            <Text
              key={key}
              className={accentTextClassName}
              onPress={() => {
                const bvid = node.url.split("/").pop();
                if (bvid?.startsWith("BV")) {
                  navigation.push("Play", { bvid, title: node.text });
                } else {
                  void Linking.openURL(node.url);
                }
              }}
            >
              {`📺 ${node.text}`}
            </Text>
          );
        }
        return (
          <Text key={key} className={bodyTextClassName}>
            {node.text}
          </Text>
        );
      })}
      {props.like || props.disliked ? (
        <>
          {/* 嵌套 Text 在原生端不支持 margin/padding，用全角空格拉开与正文的间距 */}
          <Text>{"\u2003"}</Text>
          {props.like ? <CommentLikeEntry {...props.like} /> : null}
          {props.disliked ? (
            <Text
              className={`text-[13px] font-normal ${theme.primary.text} ${
                props.like?.pending ? "opacity-60" : ""
              }`}
            >
              👎
            </Text>
          ) : null}
        </>
      ) : null}
    </Text>
  );
}

export function CommentImages(props: CommentImageEntryProps) {
  const { setImagesList, setCurrentImageIndex } = useStore();
  const imageCount = props.images.length;
  if (!imageCount) {
    return null;
  }
  const size = props.compact ? COMPACT_THUMBNAIL_SIZE : THUMBNAIL_SIZE;
  const visibleImages = props.images.slice(0, MAX_THUMBNAILS);
  const sizeClassName = props.compact ? "h-14 w-14" : "h-16 w-16";

  return (
    <View className="mt-2 flex-row gap-2">
      {visibleImages.map((image, index) => (
        <Pressable
          key={`${image.src}:${index}`}
          accessibilityRole="button"
          accessibilityLabel={`查看第 ${index + 1} 张图片（共 ${imageCount} 张）`}
          onPress={() => {
            setImagesList(props.images);
            setCurrentImageIndex(index);
          }}
        >
          <Image
            contentFit="cover"
            source={{ uri: parseImgUrl(image.src, getImagePixelSize(size)) }}
            className={clsx(sizeClassName, "rounded-lg bg-slate-100 dark:bg-slate-800")}
          />
          {index === MAX_THUMBNAILS - 1 && imageCount > MAX_THUMBNAILS ? (
            <View className="absolute inset-0 items-center justify-center rounded-lg bg-black/50">
              <Text className="text-sm font-semibold text-white">
                {`+${imageCount - MAX_THUMBNAILS}`}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
