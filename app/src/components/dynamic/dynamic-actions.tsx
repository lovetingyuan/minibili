import { MessageCircle, Share2, ThumbsUp } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useDynamicLike } from "@/api/useDynamicLike";
import type { DynamicItem } from "@/api/dynamic-items.type";
import type { FavoriteAccount } from "@/api/favorites.types";
import { theme } from "@/constants/theme";
import {
  handleLoginRequiredError,
  showLoginRequiredAlert,
} from "@/features/bilibili-session/login-required-alert";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { ThemedIcon } from "@/components/ThemedIcon";
import { handleShareDynamic, parseNumber, showToast } from "@/utils";

import { Text } from "../styled/rneui";

const ACTION_ICON_SIZE = 18;

function getDynamicShareTitle(item: DynamicItem) {
  const text = item.text.trim();
  if (text) {
    return text;
  }
  const richText = item.richTextNodes
    .map((node) => node.text)
    .filter(Boolean)
    .join("")
    .trim();
  if (richText) {
    return richText;
  }
  if (item.title) {
    return item.title;
  }
  if (
    item.content.kind === "video" ||
    item.content.kind === "article" ||
    item.content.kind === "link"
  ) {
    return item.content.title.trim();
  }
  if (item.topic?.name) {
    return item.topic.name;
  }
  return `${item.author.name}的动态`;
}

function getDynamicShareUrl(item: DynamicItem) {
  return item.url || `https://www.bilibili.com/opus/${item.id}`;
}

function DynamicShareButton(props: { item: DynamicItem }) {
  return (
    <Pressable
      className="flex-1 flex-row items-center justify-center gap-1"
      accessibilityRole="button"
      accessibilityLabel="分享动态"
      hitSlop={6}
      onPress={(event) => {
        event.stopPropagation();
        void handleShareDynamic(getDynamicShareTitle(props.item), getDynamicShareUrl(props.item));
      }}
    >
      <ThemedIcon icon={Share2} size={ACTION_ICON_SIZE} colorClassName={theme.icon.muted} />
      <Text className={`text-xs ${theme.text.muted}`}>{parseNumber(props.item.stats.forward)}</Text>
    </Pressable>
  );
}

function DynamicCommentButton(props: { item: DynamicItem; onPress?: () => void }) {
  return (
    <Pressable
      className="flex-1 flex-row items-center justify-center gap-1"
      accessibilityRole="button"
      accessibilityLabel="查看评论"
      hitSlop={6}
      onPress={
        props.onPress
          ? (event) => {
              event.stopPropagation();
              props.onPress?.();
            }
          : undefined
      }
    >
      <ThemedIcon icon={MessageCircle} size={ACTION_ICON_SIZE} colorClassName={theme.icon.muted} />
      <Text className={`text-xs ${theme.text.muted}`}>{parseNumber(props.item.stats.comment)}</Text>
    </Pressable>
  );
}

function DynamicLikeButton(props: {
  item: DynamicItem;
  account: FavoriteAccount | null;
  preparing: boolean;
}) {
  const { logout } = useBilibiliSessionActions();
  const mutation = useDynamicLike(props.account, props.item.id, props.item.stats.liked === true);

  async function press() {
    if (props.preparing) {
      showToast("正在确认登录状态，请稍候重试");
      return;
    }
    if (!props.account) {
      showLoginRequiredAlert("请先登录 B站，登录后重新点击点赞");
      return;
    }
    try {
      const liked = await mutation.toggle();
      showToast(liked ? "已点赞" : "已取消点赞");
    } catch (error) {
      if (
        handleLoginRequiredError(error, "请先登录 B站后重新操作", {
          session: { account: props.account, logout },
        })
      ) {
        return;
      }
      showToast(error instanceof Error ? error.message : "点赞失败，请稍后重试");
    }
  }

  return (
    <Pressable
      className="flex-1 flex-row items-center justify-center gap-1"
      accessibilityRole="button"
      accessibilityLabel={`${mutation.liked ? "已点赞，点击取消点赞" : "点赞动态"}，点赞数 ${
        props.item.stats.like
      }`}
      accessibilityState={{
        selected: mutation.liked,
        disabled: mutation.isMutating,
        busy: mutation.isMutating,
      }}
      disabled={mutation.isMutating}
      hitSlop={6}
      onPress={(event) => {
        event.stopPropagation();
        void press();
      }}
    >
      {mutation.isMutating ? (
        <ActivityIndicator size="small" />
      ) : (
        <ThemedIcon
          icon={ThumbsUp}
          filled={mutation.liked}
          size={ACTION_ICON_SIZE}
          colorClassName={mutation.liked ? theme.primary.accent : theme.icon.muted}
        />
      )}
      <Text className={`text-xs ${mutation.liked ? theme.primary.text : theme.text.muted}`}>
        {parseNumber(
          props.item.stats.like +
            (mutation.liked === props.item.stats.liked ? 0 : mutation.liked ? 1 : -1),
        )}
      </Text>
    </Pressable>
  );
}

export function DynamicActions(props: { item: DynamicItem; onCommentPress?: () => void }) {
  const { account, control } = useBilibiliSessionState();
  const current = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const preparing =
    account === undefined || control.phase !== "ready" || Boolean(account && !current);

  return (
    <View className="flex-row border-t border-slate-100 pt-3 dark:border-slate-800">
      <DynamicShareButton item={props.item} />
      <DynamicCommentButton item={props.item} onPress={props.onCommentPress} />
      <DynamicLikeButton
        key={`${current?.mid ?? "guest"}:${current?.generation ?? 0}:${props.item.id}`}
        item={props.item}
        account={current}
        preparing={preparing}
      />
    </View>
  );
}
