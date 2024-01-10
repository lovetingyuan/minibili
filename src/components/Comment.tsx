import React from 'react'
import { Linking, StyleSheet, View, Image, TextStyle } from 'react-native'
import { MessageContent, ReplyItem } from '../api/comments'
import { Button, Text, useTheme } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'
import { s } from '../styles'
import { imgUrl } from '../utils'
import { useStore } from '../store'

interface Props {
  upName: string
  comment: ReplyItem
}

function CommentText(props: {
  nodes: MessageContent
  style?: TextStyle | TextStyle[]
  idStr: string
}) {
  const { nodes, style, idStr } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()

  return (
    <Text style={style} selectable>
      {nodes.map((node, i) => {
        if (node.type === 'at') {
          return (
            <Text
              key={idStr + i}
              style={{
                color: theme.colors.primary,
                // fontWeight: '600',
                textShadowColor: theme.colors.primary,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 0.2, // 阴影模糊程度
              }}
              onPress={() => {
                navigation.push('Dynamic', {
                  user: {
                    face: '',
                    name: node.text.substring(1),
                    mid: node.mid,
                    sign: '-',
                  },
                })
              }}>
              {node.text}
            </Text>
          )
        }
        if (node.type === 'url') {
          return (
            <Text
              key={idStr + i}
              style={{ color: theme.colors.primary }}
              onPress={() => {
                Linking.openURL(node.url)
              }}>
              {node.url}
            </Text>
          )
        }
        if (node.type === 'emoji') {
          return (
            <Image
              key={idStr + i}
              source={{ uri: imgUrl(node.url) }}
              style={styles.emoji}
            />
          )
        }
        if (node.type === 'vote') {
          return (
            <Text
              key={idStr + i}
              style={{ color: theme.colors.primary }}
              onPress={() => {
                Linking.openURL(node.url)
              }}>
              {'🗳️ ' + node.text}
            </Text>
          )
        }
        if (node.type === 'av') {
          return (
            <Text
              key={idStr + i}
              style={{ color: theme.colors.primary }}
              onPress={() => {
                const bvid = node.url.split('/').pop()
                if (bvid?.startsWith('BV')) {
                  navigation.push('Play', {
                    bvid,
                    title: node.text,
                  })
                } else {
                  Linking.openURL(node.url)
                }
              }}>
              {'📺 ' + node.text}
            </Text>
          )
        }
        return (
          <Text style={style} selectable key={idStr + i}>
            {node.text}
          </Text>
        )
      })}
    </Text>
  )
}

export default React.memo(function Comment(props: Props) {
  const { comment, upName } = props
  const { theme } = useTheme()
  const { setImagesList, setCurrentImageIndex, setMoreRepliesUrl } = useStore()
  const upStyle = (name: string) => {
    return {
      color: upName === name ? theme.colors.secondary : theme.colors.primary,
    }
  }
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View>
      <Text style={[styles.commentContent]}>
        <Text style={[styles.commentName]}>
          <Text
            style={upStyle(comment.name)}
            onPress={() => {
              navigation.push('Dynamic', {
                user: {
                  face: comment.face,
                  name: comment.name,
                  mid: comment.mid,
                  sign: comment.sign || '-',
                },
              })
            }}>
            {comment.name}
          </Text>
          <Text>
            {comment.sex === '男' ? '♂' : comment.sex === '女' ? '♀' : ''}
          </Text>
          {comment.location ? (
            <Text style={s.t('text-sm')}>
              (
              {comment.location.includes('：')
                ? comment.location.split('：')[1]
                : comment.location}
              )
            </Text>
          ) : null}
          ：
        </Text>
        {comment.top ? (
          <>
            <Text> </Text>
            <Image
              source={require('../../assets/top.png')}
              style={styles.topComment}
            />
            <Text> </Text>
          </>
        ) : null}
        <CommentText
          nodes={comment.message}
          style={[
            styles.commentText,
            comment.upLike ? { color: theme.colors.success } : {},
            comment.top ? { color: theme.colors.primary } : {},
          ]}
          idStr={comment.id + '_'}
        />
        {comment.like ? (
          <Text style={[styles.likeNum, { color: theme.colors.secondary }]}>
            {' '}
            {comment.like}
            <Text>{comment.upLike ? '  UP👍' : ''}</Text>
          </Text>
        ) : null}
        {comment.images?.length ? (
          <Text
            style={{ color: theme.colors.primary }}
            onPress={() => {
              if (comment.images) {
                setImagesList(
                  comment.images.map(img => {
                    img.src = imgUrl(img.src)
                    return img
                  }),
                )
                setCurrentImageIndex(0)
              }
            }}>
            {'  '}查看图片
            {comment.images.length > 1 ? `(${comment.images.length})` : ''}
          </Text>
        ) : null}
      </Text>
      {comment.replies?.length ? (
        <View
          style={[
            styles.reply,
            {
              backgroundColor: theme.colors.grey5,
            },
          ]}>
          {comment.replies.map(reply => {
            return (
              <Text key={reply.id + '#'} style={styles.replyItem}>
                <Text
                  style={upStyle(reply.name)}
                  onPress={() => {
                    navigation.push('Dynamic', {
                      user: {
                        face: reply.face,
                        name: reply.name,
                        mid: reply.mid,
                        sign: reply.sign || '-',
                      },
                    })
                  }}>
                  {reply.name}
                </Text>
                <Text>
                  {reply.sex === '男' ? '♂' : reply.sex === '女' ? '♀' : ''}
                </Text>
                {reply.location ? (
                  <Text style={s.t('text-sm')}>
                    (
                    {reply.location.includes('：')
                      ? reply.location.split('：')[1]
                      : reply.location}
                    )
                  </Text>
                ) : null}
                ：
                <CommentText nodes={reply.message} idStr={reply.id + '_'} />
                {reply.like ? (
                  <Text
                    style={[styles.likeNum, { color: theme.colors.secondary }]}>
                    {' '}
                    {reply.like}
                  </Text>
                ) : null}
              </Text>
            )
          })}
          {comment.moreText ? (
            <Button
              type="clear"
              size="sm"
              onPress={() => {
                const root = comment.replies[0].root_str
                setMoreRepliesUrl(
                  `https://www.bilibili.com/h5/comment/sub?oid=${comment.oid}&pageType=${comment.type}&root=${root}`,
                )
              }}
              buttonStyle={styles.moreButton}>
              <Text style={{ color: theme.colors.primary }}>
                {comment.moreText + '...'}
              </Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  comment: {
    marginTop: 20,
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: { fontSize: 16, lineHeight: 23 },
  commentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentName: {
    fontWeight: 'bold',
    fontSize: 16,
    verticalAlign: 'middle',
  },
  top: {
    color: '#00699D',
    fontWeight: 'bold',
  },
  upLike: {
    color: '#4f7d00',
    fontWeight: 'bold',
  },
  reply: {
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 15,
    gap: 5,
    opacity: 0.9,
    flex: 1,
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    lineHeight: 20,
    fontSize: 15,
  },
  likeNum: {
    fontSize: 12,
  },
  topImg: {
    width: 24,
    height: 12,
  },
  emoji: {
    width: 18,
    height: 18,
  },
  moreButton: {
    justifyContent: 'flex-start',
    paddingHorizontal: 1,
  },
  topComment: { width: 24, height: 15, marginLeft: 5 },
})
