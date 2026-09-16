import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import type { DynamicItem } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseDate, parseImgUrl } from "@/utils";

import { Additional } from "../Additional";
import RichTexts from "../RichTexts";
import { Avatar, Text } from "../styled/rneui";
import UpName from "../UpName";
import { DynamicActions } from "./dynamic-actions";
import { DynamicMedia } from "./dynamic-media";
import { getDynamicUpTarget } from "./dynamic-target";

function DynamicAuthorRow(props: { item: DynamicItem; compact?: boolean }) {
  const { item, compact } = props;
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const avatarSize = compact ? 28 : 36;
  const meta = [item.date || parseDate(item.time, true), item.pubAction]
    .filter(Boolean)
    .join(" · ");
  const openUpSpace = () => {
    navigation.navigate("Dynamic", getDynamicUpTarget(item.author));
  };

  return (
    <View className="mb-3 flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`查看 ${item.author.name} 的主页`}
        hitSlop={4}
        onPress={openUpSpace}
      >
        <Avatar
          rounded
          size={avatarSize}
          source={
            item.author.face
              ? { uri: parseImgUrl(item.author.face, getImagePixelSize(avatarSize)) }
              : undefined
          }
          containerClassName="bg-neutral-200 dark:bg-neutral-700"
        />
      </Pressable>
      <View className="ml-3 min-w-0 flex-1 flex-row items-center gap-2">
        <UpName
          mid={item.author.mid}
          numberOfLines={1}
          onPress={openUpSpace}
          className={`shrink ${compact ? "text-sm font-semibold" : "text-base font-semibold"}`}
        >
          {item.author.name || "未知用户"}
        </UpName>
        {item.top ? (
          <View
            accessibilityLabel="置顶标签"
            className="shrink-0 rounded bg-pink-50 px-1.5 py-0.5 dark:bg-pink-950/40"
          >
            <Text className={`text-[10px] font-bold leading-3.5 ${colors.secondary.text}`}>
              置顶
            </Text>
          </View>
        ) : null}
        {meta ? (
          <Text numberOfLines={1} className={`ml-auto shrink-0 text-xs ${colors.gray6.text}`}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function DynamicBody(props: { item: DynamicItem; detail?: boolean }) {
  const { item, detail } = props;
  return (
    <>
      {item.richTextNodes.length ? (
        <RichTexts
          idStr={item.id}
          nodes={item.richTextNodes}
          topic={item.topic}
          textProps={{ numberOfLines: detail ? undefined : 6, selectable: detail }}
        />
      ) : item.text || item.topic ? (
        <>
          {item.topic ? (
            <RichTexts idStr={item.id} nodes={[]} topic={item.topic} fontSize={16} />
          ) : null}
          {item.text ? (
            <Text
              selectable={detail}
              numberOfLines={detail ? undefined : 6}
              className="mb-3 text-base leading-6"
            >
              {item.text}
            </Text>
          ) : null}
        </>
      ) : null}
      <DynamicMedia content={item.content} author={item.author} detail={detail} />
      <Additional additional={item.additional} />
    </>
  );
}

function ForwardCard(props: { item: DynamicItem; detail?: boolean }) {
  return (
    <View className="mb-3 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
      <DynamicAuthorRow item={props.item} compact />
      <DynamicBody item={props.item} detail={props.detail} />
    </View>
  );
}

export function DynamicCard(props: { item: DynamicItem; detail?: boolean; onPress?: () => void }) {
  const { item, detail, onPress } = props;
  const body = (
    <>
      <DynamicAuthorRow item={item} />
      <DynamicBody item={item} detail={detail} />
      {item.original ? <ForwardCard item={item.original} detail={detail} /> : null}
    </>
  );
  return (
    <View
      className={
        detail ? "bg-white px-3 py-4 dark:bg-neutral-950" : "bg-white p-4 dark:bg-neutral-950"
      }
    >
      {onPress ? <Pressable onPress={onPress}>{body}</Pressable> : <View>{body}</View>}
      <DynamicActions item={item} onCommentPress={detail ? undefined : onPress} />
    </View>
  );
}
