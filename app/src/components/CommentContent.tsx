import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";

import { Image } from "@/components/styled/expo";
import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseImgUrl, showToast } from "@/utils";

import type { CommentImageEntryProps, CommentTextProps } from "./comment.types";
import UpName from "./UpName";

export function CommentText(props: CommentTextProps) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  return (
    <Text className="text-[15px] leading-6">
      {props.nodes.map((node, index) => {
        const key = `${props.idStr}:${index}`;
        if (node.type === "at") {
          return (
            <UpName
              mid={node.mid}
              key={key}
              className={colors.primary.text}
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
              className={colors.primary.text}
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
          return (
            <Image
              key={key}
              source={{ uri: parseImgUrl(node.url, getImagePixelSize(18)) }}
              className="mx-0.5 h-[18px] w-[18px]"
            />
          );
        }
        if (node.type === "vote") {
          return (
            <Text
              key={key}
              className={colors.primary.text}
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
              className={colors.primary.text}
              onPress={() => {
                const bvid = node.url.split("/").pop();
                if (bvid?.startsWith("BV")) {
                  navigation.push("Play", { bvid, title: node.text });
                } else void Linking.openURL(node.url);
              }}
            >
              {`📺 ${node.text}`}
            </Text>
          );
        }
        return <Text key={key}>{node.text}</Text>;
      })}
      <CommentImages images={props.images} />
    </Text>
  );
}

export function CommentImages(props: CommentImageEntryProps) {
  const { setImagesList, setCurrentImageIndex } = useStore();
  const imageCount = props.images.length;
  if (!imageCount) return null;

  return (
    <Text
      className={colors.primary.text}
      accessibilityLabel={`查看评论中的 ${imageCount} 张图片`}
      onPress={() => {
        setCurrentImageIndex(0);
        setImagesList(props.images);
      }}
    >
      {` 🖼️ ${imageCount} 张图片`}
    </Text>
  );
}
