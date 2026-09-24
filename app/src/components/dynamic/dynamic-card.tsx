import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import type { DynamicItem } from "@/api/dynamic-items.type";
import type { DynamicArticle } from "@/api/opus-detail.type";
import { theme } from "@/constants/theme";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseDate, parseImgUrl } from "@/utils";

import { Additional } from "./Additional";
import RichTexts from "../RichTexts";
import { Avatar } from "../Avatar";
import { Text } from "../styled/rneui";
import UpName from "../UpName";
import { DynamicArticleContent, DynamicArticleLoading } from "./dynamic-article";
import { DynamicActions } from "./dynamic-actions";
import { DynamicMedia } from "./dynamic-media";
import { getDynamicUpTarget } from "./dynamic-target";
import { useOpenDynamicItem } from "./use-open-dynamic-item";

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
          containerClassName="bg-slate-200 dark:bg-slate-700"
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
            className={`shrink-0 rounded px-1.5 py-0.5 ${theme.secondary.tint}`}
          >
            <Text className={`text-[10px] font-bold leading-3.5 ${theme.secondary.text}`}>
              置顶
            </Text>
          </View>
        ) : null}
        {meta ? (
          <Text numberOfLines={1} className={`ml-auto shrink-0 text-xs ${theme.text.muted}`}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function DynamicBody(props: {
  item: DynamicItem;
  detail?: boolean;
  forward?: boolean;
  article?: DynamicArticle;
  articleLoading?: boolean;
}) {
  const { item, detail, forward, article, articleLoading } = props;
  // 专栏全文可用时，正文以全文为准，避免再渲染一遍折叠摘要
  if (article) {
    return (
      <>
        <DynamicArticleContent article={article} selectable={detail} />
        <Additional additional={item.additional} />
      </>
    );
  }
  if (articleLoading) {
    return (
      <>
        <DynamicArticleLoading />
        <Additional additional={item.additional} />
      </>
    );
  }
  return (
    <>
      {item.title ? (
        <Text
          selectable={detail}
          numberOfLines={detail ? undefined : 2}
          className="mb-2 text-base font-semibold leading-6"
        >
          {item.title}
        </Text>
      ) : null}
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
      <DynamicMedia content={item.content} author={item.author} detail={detail} forward={forward} />
      <Additional additional={item.additional} />
    </>
  );
}

function ForwardCard(props: { item: DynamicItem; detail?: boolean }) {
  const openDynamicItem = useOpenDynamicItem();
  const { item, detail } = props;
  // 被转发的原动态失效时接口只会给出一个没有 id 的占位数据：
  // 既没有可跳转的详情页，也没有作者信息，因此只展示不可交互的失效提示。
  if (!item.id) {
    return (
      <View className="mb-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
        <Text className={`text-sm ${theme.text.muted}`}>
          {item.content.kind === "unavailable" ? item.content.message : "原动态不可见"}
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="查看被转发的动态"
      className="mb-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800"
      onPress={(event) => {
        // 内层卡片拦截点击，避免同时触发外层转发动态的整卡跳转
        event.stopPropagation();
        openDynamicItem(item);
      }}
    >
      <DynamicAuthorRow item={item} compact />
      <DynamicBody item={item} detail={detail} forward />
    </Pressable>
  );
}

export function DynamicCard(props: {
  item: DynamicItem;
  detail?: boolean;
  onPress?: () => void;
  article?: DynamicArticle;
  articleLoading?: boolean;
  showActions?: boolean;
}) {
  const { item, detail, onPress, article, articleLoading } = props;
  const body = (
    <>
      <DynamicAuthorRow item={item} />
      <DynamicBody item={item} detail={detail} article={article} articleLoading={articleLoading} />
      {item.original ? <ForwardCard item={item.original} detail={detail} /> : null}
    </>
  );
  return (
    <View
      className={
        detail ? "bg-white px-3 py-4 dark:bg-slate-950" : "bg-white p-4 dark:bg-slate-950"
      }
    >
      {onPress ? <Pressable onPress={onPress}>{body}</Pressable> : <View>{body}</View>}
      {props.showActions === false ? null : (
        <DynamicActions item={item} onCommentPress={detail ? undefined : onPress} />
      )}
    </View>
  );
}
