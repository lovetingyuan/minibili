import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";

import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { showToast } from "@/utils";

import type { CommentImageEntryProps, CommentTextProps } from "./comment.types";
import { InlineEmoji } from "./InlineEmoji";
import UpName from "./UpName";

export function CommentText(props: CommentTextProps) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  // RNEUI 的 Text 在 Android 上会给每个文本节点加默认的 fontFamily/fontWeight，
  // 嵌套节点不会继承父级字重，所以加粗必须下发到每个节点。
  const boldClassName = props.bold ? "font-bold" : "";
  // 同理，UP 主觉得很赞的主题粉色也要下发到每个节点，避免原生端嵌套节点回落到默认文字色。
  const bodyTextClassName = `${props.creatorLiked ? colors.secondary.text : ""} ${boldClassName}`;
  const accentTextClassName = `${colors.primary.text} ${boldClassName}`;
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
      <CommentImages images={props.images} />
      {props.likeText ? (
        <Text
          className={`text-[13px] font-normal ${
            props.likeActive ? colors.commentLike.text : colors.primary.text
          } ${props.likePending ? "opacity-60" : ""}`}
        >
          {/* 嵌套 Text 在原生端不支持 margin/padding，用全角空格拉开与正文的间距 */}
          {`\u2003${props.likeText}`}
        </Text>
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
