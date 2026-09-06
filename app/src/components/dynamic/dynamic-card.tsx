import { Pressable, View } from "react-native";

import type { DynamicItem } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import { getImagePixelSize, parseDate, parseImgUrl, parseNumber } from "@/utils";

import { Additional } from "../Additional";
import RichTexts from "../RichTexts";
import { Avatar, Icon, Text } from "../styled/rneui";
import UpName from "../UpName";
import { DynamicMedia } from "./dynamic-media";

function DynamicAuthorRow(props: { item: DynamicItem; compact?: boolean }) {
  const { item, compact } = props;
  return (
    <View className="mb-3 flex-row items-center">
      <Avatar
        rounded
        size={compact ? 30 : 42}
        source={
          item.author.face
            ? { uri: parseImgUrl(item.author.face, getImagePixelSize(compact ? 30 : 42)) }
            : undefined
        }
        containerClassName="bg-neutral-200 dark:bg-neutral-700"
      />
      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <UpName
            mid={item.author.mid}
            numberOfLines={1}
            className={compact ? "text-sm font-semibold" : "text-base font-semibold"}
          >
            {item.author.name || "未知用户"}
          </UpName>
          {item.top ? (
            <Text className={`text-xs font-semibold ${colors.secondary.text}`}>置顶</Text>
          ) : null}
        </View>
        <Text className={`text-xs ${colors.gray6.text}`}>
          {[item.date || parseDate(item.time, true), item.pubAction].filter(Boolean).join(" · ")}
        </Text>
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

function DynamicStats(props: { item: DynamicItem; onPress?: () => void }) {
  const entries = [
    { name: "share-outline", value: props.item.stats.forward },
    { name: "comment-outline", value: props.item.stats.comment },
    { name: "thumb-up-outline", value: props.item.stats.like },
  ];
  return (
    <View className="flex-row border-t border-neutral-100 pt-3 dark:border-neutral-800">
      {entries.map((entry) => (
        <Pressable
          key={entry.name}
          onPress={props.onPress}
          className="flex-1 flex-row items-center justify-center gap-1"
        >
          <Icon
            name={entry.name}
            type="material-community"
            size={18}
            colorClassName={colors.gray6.accent}
          />
          <Text className={`text-xs ${colors.gray6.text}`}>
            {entry.value ? parseNumber(entry.value) : "-"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DynamicCard(props: { item: DynamicItem; detail?: boolean; onPress?: () => void }) {
  const { item, detail, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      className={
        detail ? "bg-white px-3 py-4 dark:bg-neutral-950" : "bg-white p-4 dark:bg-neutral-950"
      }
    >
      <DynamicAuthorRow item={item} />
      <DynamicBody item={item} detail={detail} />
      {item.original ? <ForwardCard item={item.original} detail={detail} /> : null}
      <DynamicStats item={item} onPress={onPress} />
    </Pressable>
  );
}
