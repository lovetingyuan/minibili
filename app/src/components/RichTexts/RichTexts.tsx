import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import { Hash } from "lucide-react-native";
import React from "react";
import { Linking, type TextProps, View } from "react-native";

import type { RichTextNode } from "@/api/dynamic-items.schema";
import { HandledRichTextType } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import { ThemedIcon } from "@/components/ThemedIcon";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { parseUrl } from "@/utils";

import { InlineEmoji } from "../InlineEmoji";
import { getRichTextsContainerClassName, getRichTextsTextClassName } from "./rich-texts.helpers";
import { Text } from "@/components/styled/rneui";
import UpName from "../UpName";

type Props = {
  idStr: string | number | null;
  nodes?: RichTextNode[];
  topic?: { name: string; jump_url: string } | null;
  className?: string;
  textProps?: TextProps;
  fontSize?: number;
};

function RichTexts(props: Props) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { setImagesList, setCurrentImageIndex } = useStore();
  const [lines, setLines] = React.useState(0);
  const fontSize = props.fontSize || 16;
  const textSizeClassName = fontSize <= 14 ? "text-sm" : fontSize >= 18 ? "text-lg" : "text-base";
  const textLineClassName =
    fontSize <= 14
      ? "text-sm leading-[22.4px]"
      : fontSize >= 18
        ? "text-lg leading-[28.8px]"
        : "text-base leading-[25.6px]";

  function openUrl(url?: string) {
    if (url) {
      void Linking.openURL(parseUrl(url));
    }
  }

  const hasNodes = (props.nodes?.length ?? 0) > 0;
  const topic = props.topic ? (
    <View className={clsx("flex-row items-center", hasNodes && "mb-2")}>
      <ThemedIcon icon={Hash} colorClassName={colors.primary.accent} size={14} />
      <Text
        onPress={() => {
          if (props.topic?.jump_url) {
            navigation.navigate("WebPage", {
              title: `话题：${props.topic.name}`,
              url: parseUrl(props.topic.jump_url),
            });
          }
        }}
        className={clsx(colors.primary.text, textSizeClassName)}
      >
        {` ${props.topic.name}`}
      </Text>
    </View>
  ) : null;

  const nodes = (props.nodes ?? []).map((node, index) => {
    const key = `${props.idStr ?? "rich"}-${index}`;
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_AT && node.rid !== undefined) {
      return (
        <UpName
          mid={node.rid}
          key={key}
          onPress={() => {
            navigation.push("Dynamic", {
              user: {
                face: "",
                name: node.text.replace(/^@/, ""),
                mid: node.rid ?? "",
                sign: "-",
              },
            });
          }}
          className={clsx(colors.primary.text, textSizeClassName)}
        >
          {node.text}
        </UpName>
      );
    }
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI && node.emoji?.icon_url) {
      return <InlineEmoji key={key} url={node.emoji.icon_url} size={20} fontSize={fontSize} />;
    }
    if (
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_BV ||
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_AV ||
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_OGV_EP
    ) {
      return (
        <Text
          key={key}
          className={clsx(colors.primary.text, textSizeClassName)}
          onPress={() => {
            const rid = String(node.rid ?? "");
            if (rid.startsWith("BV")) {
              navigation.push("Play", { bvid: rid, title: node.text });
            } else {
              openUrl(node.jump_url);
            }
          }}
        >
          {`📺 ${node.text}`}
        </Text>
      );
    }
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_MAIL) {
      return (
        <Text
          key={key}
          className={clsx(colors.primary.text, textSizeClassName)}
          onPress={() => openUrl(`mailto:${node.text}`)}
        >
          {`📧 ${node.text}`}
        </Text>
      );
    }
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_VOTE) {
      return (
        <Text
          key={key}
          className={clsx(colors.primary.text, textSizeClassName)}
          onPress={() =>
            openUrl(`https://t.bilibili.com/vote/h5/index/#/result?vote_id=${node.rid ?? ""}`)
          }
        >
          {`🗳️ ${node.text}`}
        </Text>
      );
    }
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_LOTTERY) {
      return (
        <Text
          key={key}
          className={clsx(colors.primary.text, textSizeClassName)}
          onPress={() =>
            openUrl(
              `https://t.bilibili.com/lottery/h5/index/#/result?business_type=1&business_id=${props.idStr ?? ""}&isWeb=1`,
            )
          }
        >
          {`🎁 ${node.text}`}
        </Text>
      );
    }
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_VIEW_PICTURE && node.pics) {
      return (
        <Text
          key={key}
          className={clsx(colors.primary.text, textSizeClassName)}
          onPress={() => {
            const images = node.pics
              ?.map((pic) => {
                const src = pic.src || pic.url;
                if (!src) {
                  return null;
                }
                return {
                  src: parseUrl(src),
                  width: Math.max(1, pic.width ?? 1),
                  height: Math.max(1, pic.height ?? 1),
                };
              })
              .filter((image): image is { src: string; width: number; height: number } =>
                Boolean(image),
              );
            if (images?.length) {
              setImagesList(images);
              setCurrentImageIndex(0);
            }
          }}
        >
          {`🖼️ ${node.text}`}
        </Text>
      );
    }
    const isLink = node.type !== HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT && node.jump_url;
    return (
      <Text
        key={key}
        className={clsx(isLink && colors.primary.text, textLineClassName)}
        onPress={isLink ? () => openUrl(node.jump_url) : undefined}
      >
        {isLink ? `🔗 ${node.text}` : node.text}
      </Text>
    );
  });

  const textOverflow =
    typeof props.textProps?.numberOfLines === "number" && lines > props.textProps.numberOfLines;
  return (
    // 容器必须是内容撑开的高度，见 rich-texts.helpers.ts（加 flex-1 会在头部重排时塌成 0 高）
    <View className={getRichTextsContainerClassName(textOverflow, props.className)}>
      {topic}
      {hasNodes ? (
        <Text
          className={getRichTextsTextClassName()}
          {...props.textProps}
          onTextLayout={(event) => setLines(event.nativeEvent.lines.length)}
        >
          {nodes}
          <Text className="text-[4px]">{"\n "}</Text>
        </Text>
      ) : null}
    </View>
  );
}

export default RichTexts;
