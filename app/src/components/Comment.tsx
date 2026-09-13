import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Avatar, Icon, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseImgUrl, parseNumber } from "@/utils";

import { shouldShowReplySection } from "../api/replies.helpers";
import type { CommentItemProps, CommentProps } from "./comment.types";
import { CommentText } from "./CommentContent";
import UpName from "./UpName";

function CommentActions(props: CommentItemProps) {
  const { comment } = props;
  const pending = props.isAttitudePending(comment.id);
  return (
    <View className="mt-1 flex-row items-center gap-3">
      <Pressable
        className="min-h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-full px-2"
        accessibilityRole="button"
        accessibilityLabel={comment.attitude === "like" ? "取消点赞评论" : "点赞评论"}
        accessibilityState={{ selected: comment.attitude === "like", disabled: pending }}
        disabled={pending}
        hitSlop={2}
        onPress={() => void props.onAttitude(comment, "like")}
      >
        {pending ? (
          <ActivityIndicator size={15} />
        ) : (
          <Icon
            name={comment.attitude === "like" ? "thumb-up" : "thumb-up-off-alt"}
            size={18}
            colorClassName={
              comment.attitude === "like" ? colors.primary.accent : colors.gray6.accent
            }
          />
        )}
        <Text
          className={`text-xs ${comment.attitude === "like" ? colors.primary.text : colors.gray6.text}`}
        >
          {comment.like ? parseNumber(comment.like) : "赞"}
        </Text>
      </Pressable>
      <Pressable
        className="min-h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-full px-2"
        accessibilityRole="button"
        accessibilityLabel={comment.attitude === "dislike" ? "取消点踩评论" : "点踩评论"}
        accessibilityState={{ selected: comment.attitude === "dislike", disabled: pending }}
        disabled={pending}
        hitSlop={2}
        onPress={() => void props.onAttitude(comment, "dislike")}
      >
        <Icon
          name={comment.attitude === "dislike" ? "thumb-down" : "thumb-down-off-alt"}
          size={18}
          colorClassName={
            comment.attitude === "dislike" ? colors.primary.accent : colors.gray6.accent
          }
        />
        <Text
          className={`text-xs ${comment.attitude === "dislike" ? colors.primary.text : colors.gray6.text}`}
        >
          踩
        </Text>
      </Pressable>
      <Pressable
        className="min-h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-full px-2"
        accessibilityRole="button"
        accessibilityLabel={`回复 ${comment.name}`}
        hitSlop={2}
        onPress={() => props.onReply(comment)}
      >
        <Icon name="reply" size={18} colorClassName={colors.gray6.accent} />
        <Text className={`text-xs ${colors.gray6.text}`}>回复</Text>
      </Pressable>
    </View>
  );
}

export function CommentItem(props: CommentItemProps) {
  const { comment, compact } = props;
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const isOwner = Boolean(props.ownerMid && String(comment.mid) === props.ownerMid);
  const meta = [comment.time?.replace("发布", ""), comment.location?.replace("IP属地：", "")]
    .filter(Boolean)
    .join(" · ");
  return (
    <View className={compact ? "gap-1.5" : "gap-2"}>
      <View className="flex-row items-center gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`查看 ${comment.name} 的主页`}
          hitSlop={4}
          onPress={() =>
            navigation.push("Dynamic", {
              user: {
                face: comment.face,
                name: comment.name,
                mid: comment.mid,
                sign: comment.sign || "-",
              },
            })
          }
        >
          <Avatar
            rounded
            size={compact ? 24 : 28}
            source={
              comment.face
                ? { uri: parseImgUrl(comment.face, getImagePixelSize(compact ? 24 : 28)) }
                : undefined
            }
            title={comment.name.slice(0, 1)}
            containerClassName="bg-neutral-200 dark:bg-neutral-700"
          />
        </Pressable>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <UpName
              mid={comment.mid}
              numberOfLines={1}
              className={clsx(
                "shrink text-sm font-semibold",
                isOwner ? colors.secondary.text : colors.gray7.text,
              )}
            >
              {comment.name}
            </UpName>
            {isOwner ? (
              <Text className={`text-[10px] font-bold ${colors.secondary.text}`}>UP</Text>
            ) : null}
            {comment.top ? (
              <Text className={`text-[10px] font-bold ${colors.secondary.text}`}>置顶</Text>
            ) : null}
            {meta ? (
              <Text
                numberOfLines={1}
                className={`ml-auto shrink-0 text-[11px] ${colors.gray6.text}`}
              >
                {meta}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      <View>
        <CommentText nodes={comment.message} idStr={comment.id} images={comment.images} />
        {comment.creatorLiked ? (
          <View className="mt-2 self-start rounded-full bg-pink-50 px-2.5 py-1 dark:bg-pink-950/40">
            <Text className={`text-[11px] font-medium ${colors.secondary.text}`}>
              UP 主觉得很赞
            </Text>
          </View>
        ) : null}
        <CommentActions {...props} />
      </View>
    </View>
  );
}

export function Comment(props: CommentProps) {
  const { setRepliesInfo } = useStore();
  const comment = props.comment;
  const hasReplies = shouldShowReplySection(comment.rcount, comment.replies.length);

  function openReplies(target: CommentItemProps["comment"], focusComposer: boolean) {
    setRepliesInfo({
      oid: comment.oid,
      type: comment.type,
      root: comment.id,
      allCount: comment.rcount,
      rootComment: comment,
      previewReplies: comment.replies,
      addedReplies: [],
      ownerMid: props.ownerMid,
      sourceUrl: props.sourceUrl,
      replyTarget: target,
      focusComposer,
    });
  }

  const moreRepliesButton =
    comment.rcount > 0 ? (
      <Pressable
        className={clsx("self-start", !comment.replies.length && "mt-2")}
        accessibilityRole="button"
        accessibilityLabel={`查看全部 ${comment.rcount} 条回复`}
        hitSlop={4}
        onPress={() => openReplies(comment, false)}
      >
        <Text className={`text-sm font-medium ${colors.primary.text}`}>
          {comment.moreText || `查看全部 ${comment.rcount} 条回复`} ›
        </Text>
      </Pressable>
    ) : null;

  return (
    <View className="mb-1 border-b border-neutral-100 py-4 dark:border-neutral-800">
      <CommentItem
        comment={comment}
        ownerMid={props.ownerMid}
        onAttitude={props.onAttitude}
        onReply={(target) => openReplies(target, true)}
        isAttitudePending={props.isAttitudePending}
      />
      {comment.replies.length ? (
        <View className="mt-3 gap-3 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ownerMid={props.ownerMid}
              compact
              onAttitude={props.onAttitude}
              onReply={(target) => openReplies(target, true)}
              isAttitudePending={props.isAttitudePending}
            />
          ))}
          {moreRepliesButton}
        </View>
      ) : hasReplies ? (
        moreRepliesButton
      ) : null}
    </View>
  );
}
