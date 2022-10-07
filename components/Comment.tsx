import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getVideoComments } from '../services/Bilibili';
import { GetFuncPromiseType } from '../types';
import RichText from './RichText';

type Comments = GetFuncPromiseType<typeof getVideoComments>;

interface Props {
  upName: string;
  comment: Comments[0];
}

export default function Reply(props: Props) {
  const { comment, upName } = props;
  const upStyle =
    upName === props.comment.name
      ? {
          color: '#FF6699',
        }
      : null;

  return (
    <>
      <View style={styles.comment}>
        <Text style={[styles.commentName, upStyle]}>{comment.name}: </Text>
        <Text
          style={[
            styles.commentContent,
            comment.upLike ? styles.upLike : null,
            comment.top ? styles.top : null,
          ]}>
          <RichText text={comment.message} />
          <Text style={styles.likeNum}>
            {comment.like ? ` ${comment.like}👍` : ''}
          </Text>
        </Text>
      </View>
      {comment.replies ? (
        <View style={styles.reply}>
          {comment.replies.map(reply => {
            return (
              <View key={reply.id} style={styles.replyItem}>
                <Text style={[styles.replyName, upStyle]}>{reply.name}: </Text>
                <View style={styles.replyContent}>
                  <RichText text={reply.message} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  comment: {},
  commentContent: {},
  commentName: {},
  upLike: {},
  top: {},
  reply: {},
  replyItem: {},
  replyName: {},
  replyContent: {},
  likeNum: { fontSize: 12 },
});
