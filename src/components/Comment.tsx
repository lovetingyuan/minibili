import { useNavigation } from '@react-navigation/native'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, type TextStyle, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { MessageContent, ReplyItem } from '../api/comments'
import { useStore } from '../store'
import type { NavigationProps } from '../types'
import { imgUrl } from '../utils'

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
  const textShadowRadius = 0.2

  return (
    <Text style={style} selectable>
      {nodes.map((node, i) => {
        if (node.type === 'at') {
          return (
            <Text
              key={idStr + i}
              className={colors.primary.text}
              style={{
                textShadowColor: tw(colors.primary.text).color,
                textShadowRadius,
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
              className={colors.primary.text}
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
              className="w-[18px] h-[18px]"
            />
          )
        }
        if (node.type === 'vote') {
          return (
            <Text
              key={idStr + i}
              className={colors.primary.text}
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
              className={colors.primary.text}
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

export default React.memo(Comment)

function Comment(props: Props) {
  const { comment, upName } = props
  const { setImagesList, setCurrentImageIndex, setMoreRepliesUrl } = useStore()

  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View className="flex-1 shrink-0">
      <Text className="flex-row items-center mb-1 justify-center">
        <Text className="font-bold text-base align-middle leading-7">
          <Text
            className={
              upName === comment.name
                ? colors.secondary.text
                : colors.primary.text
            }
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
          {/* {comment.location ? (
            <Text className="text-sm">
              (
              {comment.location.includes('：')
                ? comment.location.split('：')[1]
                : comment.location}
              )
            </Text>
          ) : null} */}
          ：
        </Text>
        {comment.top ? (
          <Text
            className={`border ${colors.secondary.border} rounded font-bold text-sm ${colors.secondary.text}`}>
            置顶{' '}
          </Text>
        ) : null}
        <CommentText
          nodes={comment.message}
          className={`text-base leading-7 ${
            comment.upLike ? colors.success.text : ''
          } ${comment.top ? colors.primary.text : ''}`}
          idStr={comment.id + '_'}
        />
        {comment.like ? (
          <Text className={`text-xs ${colors.secondary.text}`}>
            {' '}
            {comment.like}
            <Text>{comment.upLike ? '  UP👍' : ''}</Text>
          </Text>
        ) : null}
        {comment.images?.length ? (
          <Text
            className={colors.primary.text}
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
        <View className="p-2 rounded mt-1 mb-4 gap-1 opacity-90 flex-1 shrink-0 border-gray-500 bg-neutral-200 dark:bg-neutral-900">
          {comment.replies.map(reply => {
            return (
              <Text
                key={`${reply.id}#`}
                className="flex-row items-center flex-wrap text-sm">
                <Text
                  className={
                    upName === reply.name
                      ? colors.secondary.text
                      : colors.primary.text
                  }
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
                <Text>：</Text>
                <CommentText
                  nodes={reply.message}
                  idStr={reply.id + '_'}
                  className="leading-6 border"
                />
                {reply.like ? (
                  <Text className={`text-xs ${colors.secondary.text}`}>
                    {' ' + reply.like}
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
              buttonStyle={tw('justify-start p-0  ')}>
              <Text className={colors.primary.text}>
                {comment.moreText + '...'}
              </Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
