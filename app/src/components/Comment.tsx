import { useNavigation } from "@react-navigation/native";
import { clsx } from "clsx";
import { Pressable, View } from "react-native";

import { Avatar, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseImgUrl, parseNumber } from "@/utils";

import { shouldShowReplySection } from "../api/replies.helpers";
import type { CommentItemProps, CommentProps } from "./comment.types";
import { CommentText } from "./CommentContent";
import UpName from "./UpName";

export function CommentItem(props: CommentItemProps) {
  const { comment, compact } = props;
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { setOverlayButtons } = useStore();
  const isOwner = Boolean(props.ownerMid && String(comment.mid) === props.ownerMid);
  const meta = [comment.time?.replace("发布", ""), comment.location?.replace("IP属地：", "")]
    .filter(Boolean)
    .join(" · ");
  const liked = comment.attitude === "like";
  const likeText = [
    comment.like ? `👍${parseNumber(comment.like)}${comment.creatorLiked ? "+UP" : ""}` : "",
    comment.attitude === "dislike" ? "👎" : "",
  ].join("");

  function openActions() {
    setOverlayButtons([
      {
        text: comment.attitude === "like" ? "取消点赞" : "点赞",
        onPress: () => void props.onAttitude(comment, "like"),
      },
      {
        text: comment.attitude === "dislike" ? "取消点踩" : "点踩",
        onPress: () => void props.onAttitude(comment, "dislike"),
      },
      {
        text: "回复",
        onPress: () => props.onReply(comment),
      },
    ]);
  }

  return (
    <Pressable
      className={compact ? "gap-1.5" : "gap-2"}
      accessibilityHint="长按可点赞、点踩或回复"
      onLongPress={openActions}
    >
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
      <View className="pl-2">
        <CommentText
          nodes={comment.message}
          idStr={comment.id}
          images={comment.images}
          likeText={likeText}
          likeActive={liked}
          likePending={props.isAttitudePending(comment.id)}
          bold={liked}
        />
        {comment.creatorLiked ? (
          <View className="mt-2 self-start rounded-full bg-pink-50 px-2.5 py-1 dark:bg-pink-950/40">
            <Text className={`text-[11px] font-medium ${colors.secondary.text}`}>
              UP 主觉得很赞
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
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
