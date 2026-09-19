import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';
import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, View } from 'react-native';

import { Avatar, Text } from '@/components/styled/rneui';
import { colors } from '@/constants/colors.tw';
import { useStore } from '@/store';
import type { NavigationProps } from '@/types';
import { getImagePixelSize, parseImgUrl, parseNumber, showToast } from '@/utils';

import { shouldShowReplySection } from '../api/replies.helpers';
import type { CommentItemProps, CommentProps } from './comment.types';
import { CommentText } from './CommentContent';
import UpName from './UpName';

function getCommentCopyText(comment: CommentItemProps['comment']) {
  const message = comment.message
    .map((node) => {
      if (node.type === 'url') {
        return node.url;
      }
      if (node.type === 'emoji') {
        return '[表情]';
      }
      if (node.type === 'vote') {
        return node.text || '投票';
      }
      return node.text;
    })
    .join('');
  const images = Array.from({ length: comment.images.length }, () => '[图片]').join('');
  return [message, images].filter(Boolean).join('\n');
}

export function CommentItem(props: CommentItemProps) {
  const { comment, compact } = props;
  const navigation = useNavigation<NavigationProps['navigation']>();
  const { setOverlayButtons } = useStore();
  const isOwner = Boolean(props.ownerMid && String(comment.mid) === props.ownerMid);
  const onDelete = props.onDelete;
  const canDelete = Boolean(onDelete && props.viewerMid && String(comment.mid) === props.viewerMid);
  const deletePending = props.isDeletePending?.(comment.id) ?? false;
  const meta = [comment.time?.replace('发布', ''), comment.location?.replace('IP属地：', '')]
    .filter(Boolean)
    .join(' · ');
  const liked = comment.attitude === 'like';
  const likeText = [
    comment.like ? `👍${parseNumber(comment.like)}${comment.creatorLiked ? '+UP' : ''}` : '',
    comment.attitude === 'dislike' ? '👎' : '',
  ].join('');

  function openActions() {
    setOverlayButtons([
      {
        text: '复制评论',
        onPress: () => {
          void Clipboard.setStringAsync(getCommentCopyText(comment)).then(() => showToast('已复制评论'));
        },
      },
      {
        text: comment.attitude === 'like' ? '取消点赞' : '点赞',
        onPress: () => void props.onAttitude(comment, 'like'),
      },
      {
        text: comment.attitude === 'dislike' ? '取消点踩' : '点踩',
        onPress: () => void props.onAttitude(comment, 'dislike'),
      },
      {
        text: `回复「${comment.name}」`,
        onPress: () => props.onReply(comment),
      },
    ]);
  }

  function confirmDelete() {
    if (!onDelete || deletePending) {
      return;
    }
    const deletingRoot = String(comment.root) === '0';
    const message = deletingRoot
      ? '删除评论后，评论下所有回复都会被删除，是否继续？'
      : '删除回复后无法恢复，是否继续？';
    Alert.alert('删除评论', message, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => void onDelete(comment),
      },
    ]);
  }

  return (
    <Pressable
      className={compact ? 'gap-1.5' : 'gap-2'}
      accessibilityHint="长按可复制、点赞、点踩或回复"
      onLongPress={openActions}
    >
      <View className="flex-row items-center gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`查看 ${comment.name} 的主页`}
          hitSlop={4}
          onPress={() =>
            navigation.push('Dynamic', {
              user: {
                face: comment.face,
                name: comment.name,
                mid: comment.mid,
                sign: comment.sign || '-',
              },
            })
          }
        >
          <Avatar
            rounded
            size={compact ? 24 : 28}
            source={comment.face ? { uri: parseImgUrl(comment.face, getImagePixelSize(compact ? 24 : 28)) } : undefined}
            title={comment.name.slice(0, 1)}
            containerClassName="bg-neutral-200 dark:bg-neutral-700"
          />
        </Pressable>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <UpName
              mid={comment.mid}
              numberOfLines={1}
              className={clsx('shrink text-sm font-semibold', isOwner ? colors.secondary.text : colors.gray7.text)}
            >
              {comment.name}
            </UpName>
            {isOwner ? <Text className={`text-[10px] font-bold ${colors.secondary.text}`}>UP</Text> : null}
            {comment.top ? (
              <View
                accessibilityLabel="置顶标签"
                className="shrink-0 rounded bg-pink-50 px-1.5 py-0.5 dark:bg-pink-950/40"
              >
                <Text className={`text-[10px] font-bold leading-3.5 ${colors.secondary.text}`}>置顶</Text>
              </View>
            ) : null}
            <View className="ml-auto shrink-0 flex-row items-center gap-2">
              {meta ? (
                <Text numberOfLines={1} className={`text-[11px] ${colors.gray6.text}`}>
                  {meta}
                </Text>
              ) : null}
              {canDelete ? (
                <Pressable
                  className="rounded px-0.5 py-1"
                  accessibilityRole="button"
                  accessibilityLabel="删除评论"
                  accessibilityState={{ disabled: deletePending, busy: deletePending }}
                  disabled={deletePending}
                  hitSlop={8}
                  onPress={confirmDelete}
                >
                  <Text className={`text-[11px] font-medium ${deletePending ? colors.gray6.text : colors.error.text}`}>
                    删除
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
      <View>
        <CommentText
          nodes={comment.message}
          idStr={comment.id}
          images={comment.images}
          likeText={likeText}
          likeActive={liked}
          likePending={props.isAttitudePending(comment.id)}
          bold={liked}
          creatorLiked={comment.creatorLiked}
        />
      </View>
    </Pressable>
  );
}

export function Comment(props: CommentProps) {
  const { setRepliesInfo } = useStore();
  const comment = props.comment;
  const hasReplies = shouldShowReplySection(comment.rcount, comment.replies.length);

  function openReplies(target: CommentItemProps['comment'], focusComposer: boolean) {
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
        className={clsx('-mx-2 rounded-lg px-2 py-1.5 active:bg-neutral-400/20', !comment.replies.length && 'mt-2')}
        accessibilityRole="button"
        accessibilityLabel={`查看全部 ${comment.rcount} 条回复`}
        onPress={() => openReplies(comment, false)}
      >
        <Text className={`text-sm font-medium ${colors.primary.text}`}>
          {comment.moreText || `查看全部 ${comment.rcount} 条回复`} ›
        </Text>
      </Pressable>
    ) : null;

  return (
    <View className={clsx('bg-white p-3 dark:bg-neutral-900', props.first ? 'rounded-b-2xl' : 'rounded-2xl')}>
      <CommentItem
        comment={comment}
        ownerMid={props.ownerMid}
        onAttitude={props.onAttitude}
        onReply={(target) => openReplies(target, true)}
        onDelete={props.onDelete}
        viewerMid={props.viewerMid}
        isDeletePending={props.isDeletePending}
        isAttitudePending={props.isAttitudePending}
      />
      {comment.replies.length ? (
        <View className="mt-3 gap-3 rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-800">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ownerMid={props.ownerMid}
              compact
              onAttitude={props.onAttitude}
              onReply={(target) => openReplies(target, true)}
              onDelete={props.onDelete}
              viewerMid={props.viewerMid}
              isDeletePending={props.isDeletePending}
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
