import React from 'react'
import { Linking, View, Image, TextStyle } from 'react-native'
import { MessageContent, ReplyItem } from '../api/comments'
import { Button, Text, useTheme } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'
import { imgUrl } from '../utils'
import { useStore } from '../store'

interface Props {
  upName: string
  comment: ReplyItem
}

function CommentText(props: {
  nodes: MessageContent
  className?: string
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
              className="w-4 h-4"
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
      <Text className="flex-row items-center mb-1">
        <Text className="font-bold text-base align-middle">
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
            <Text className="text-sm">
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
              className="w-6 h-4 ml-1"
            />
            <Text> </Text>
          </>
        ) : null}
        <CommentText
          nodes={comment.message}
          className="text-base"
          style={[
            comment.upLike ? { color: theme.colors.success } : {},
            comment.top ? { color: theme.colors.primary } : {},
          ]}
          idStr={comment.id + '_'}
        />
        {comment.like ? (
          <Text className="text-xs" style={{ color: theme.colors.secondary }}>
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
          className="p-2 rounded mt-1 mb-4 gap-1 opacity-90 flex-1"
          style={{
            backgroundColor: theme.colors.grey5,
          }}>
          {comment.replies.map(reply => {
            return (
              <Text
                key={reply.id + '#'}
                className="flex-row items-center flex-wrap text-sm leading-5">
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
                  <Text className="text-sm">
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
                    className="text-xs"
                    style={{ color: theme.colors.secondary }}>
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
              buttonStyle={tw('justify-start px-0')}>
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
