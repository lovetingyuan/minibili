import { useNavigation } from '@react-navigation/native'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, View } from 'react-native'

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
  idStr: string
  fontSize: string
}) {
  const { nodes, idStr, fontSize } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  const textShadowRadius = 0.2

  return (
    // <Text style={style} selectable>
    <>
      {nodes.map((node, i) => {
        const key = idStr + i
        if (node.type === 'at') {
          return (
            <Text
              key={key}
              className={`${colors.primary.text} ${fontSize}`}
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
              key={key}
              className={`${colors.primary.text} ${fontSize}`}
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
              key={key}
              source={{ uri: imgUrl(node.url) }}
              className="w-[18px] h-[18px] mx-1"
            />
          )
        }
        if (node.type === 'vote') {
          return (
            <Text
              key={key}
              className={`${colors.primary.text} ${fontSize}`}
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
              key={key}
              className={`${colors.primary.text} ${fontSize}`}
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
          <Text className={fontSize} selectable key={key}>
            {node.text}
          </Text>
        )
      })}
    </>
  )
}

export default React.memo(Comment)

function CommentItem(props: {
  comment: ReplyItem | ReplyItem['replies'][0]
  upName: string
}) {
  const { comment, upName } = props
  const { setImagesList, setCurrentImageIndex } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const fontSize = 'rcount' in comment ? 'text-base' : 'text-sm'
  return (
    <Text>
      <Text
        className={`${
          upName === comment.name
            ? colors.secondary.text + ' font-bold'
            : colors.primary.text
        } ${fontSize}`}
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
      <Text className={fontSize}>
        {comment.sex === '男' ? '♂：' : comment.sex === '女' ? '♀：' : '：'}
      </Text>
      {'top' in comment && comment.top ? (
        <Text className={fontSize}> 🔝 </Text>
      ) : null}
      {comment.message?.length ? (
        <CommentText
          fontSize={fontSize}
          nodes={comment.message}
          idStr={comment.id + '_'}
        />
      ) : null}
      {comment.like ? (
        <Text className={`text-xs ${colors.secondary.text}`}>
          {' ' + comment.like + (comment.upLike ? '+UP👍' : '')}
        </Text>
      ) : null}
      {'images' in comment && comment.images?.length ? (
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
          {`  查看图片${comment.images.length > 1 ? `(${comment.images.length})` : ''}`}
        </Text>
      ) : null}
    </Text>
  )
}

function Comment(props: Props) {
  const { comment, upName } = props
  const { setMoreRepliesUrl } = useStore()

  return (
    <View className="flex-1 shrink-0 mb-7">
      <CommentItem comment={comment} upName={upName} />
      {comment.replies?.length ? (
        <View className="p-2 mt-1 rounded gap-1 opacity-90 flex-1 shrink-0 border-gray-500 bg-neutral-200 dark:bg-neutral-900">
          {comment.replies.map(reply => {
            return (
              <CommentItem key={reply.id} comment={reply} upName={upName} />
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
              buttonStyle={tw('justify-start p-[1px]')}>
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
