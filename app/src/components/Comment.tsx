import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button, Text } from '@/components/styled/rneui'
import { clsx } from 'clsx'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Image, Linking, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { CommentItemType, CommentMessageContent } from '../api/comments'
import { useStore } from '../store'
import type { NavigationProps, RootStackParamList } from '../types'
import { parseImgUrl, showToast } from '../utils'

function CommentText(props: {
  nodes: CommentMessageContent
  idStr: string
  textClassName?: string
}) {
  const { nodes, idStr, textClassName } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  const route = useRoute<
    NativeStackScreenProps<
      RootStackParamList,
      'Play' // | 'DynamicDetail'
    >['route']
  >()
  const upName = route.params ? route.params.name : ''
  return (
    <>
      {nodes.map((node, i) => {
        const key = idStr + i
        if (node.type === 'at') {
          const name = node.text.substring(1)
          return (
            <Text
              key={key}
              className={clsx(
                textClassName,
                upName === name ? colors.secondary.text : colors.primary.text,
              )}
              onPress={() => {
                navigation.push('Dynamic', {
                  user: {
                    face: '',
                    name,
                    mid: node.mid,
                    sign: '-',
                  },
                })
              }}
            >
              {node.text}
            </Text>
          )
        }
        if (node.type === 'url') {
          return (
            <Text
              key={key}
              className={clsx(textClassName, colors.primary.text)}
              onLongPress={() => {
                Clipboard.setStringAsync(node.url).then(() => {
                  showToast('已复制链接')
                })
              }}
              onPress={() => {
                Linking.openURL(node.url)
              }}
            >
              {'🔗 链接 '}
            </Text>
          )
        }
        if (node.type === 'emoji') {
          return (
            <Image
              key={key}
              source={{ uri: parseImgUrl(node.url) }}
              className="mx-1 h-[18px] w-[18px]"
            />
          )
        }
        if (node.type === 'vote') {
          return (
            <Text
              key={key}
              className={clsx(textClassName, colors.primary.text)}
              onPress={() => {
                if (node.url) {
                  Linking.openURL(node.url)
                }
              }}
            >
              {`🗳️ ${node.text}`}
            </Text>
          )
        }
        if (node.type === 'av') {
          return (
            <Text
              key={key}
              className={clsx(textClassName, colors.primary.text)}
              onPress={() => {
                const bvid = node.url?.split('/').pop()
                if (bvid?.startsWith('BV')) {
                  navigation.push('Play', {
                    bvid,
                    title: node.text ?? '',
                  })
                } else {
                  Linking.openURL(node.url)
                }
              }}
            >
              {`📺 ${node.text}`}
            </Text>
          )
        }
        return (
          <Text className={textClassName} key={key}>
            {node.text}
          </Text>
        )
      })}
    </>
  )
}

export function CommentItem(props: {
  comment: CommentItemType | CommentItemType['replies'][0]
  smallFont?: boolean
}) {
  const { comment } = props
  const { setImagesList, setCurrentImageIndex } = useStore()
  const route = useRoute<
    NativeStackScreenProps<
      RootStackParamList,
      'Play' // | 'DynamicDetail'
    >['route']
  >()
  const upName = route.params ? route.params.name : ''
  const navigation = useNavigation<NavigationProps['navigation']>()
  const fontSize = props.smallFont ? 'text-sm' : 'text-base'
  // console.log(999, clsx(fontSize, comment.upLike && 'font-bold'))
  return (
    <Text className="py-0.5">
      <Text
        className={clsx(
          colors.primary.text,
          upName === comment.name && [colors.secondary.text, 'font-bold'],
          fontSize,
        )}
        onPress={() => {
          navigation.push('Dynamic', {
            user: {
              face: comment.face,
              name: comment.name,
              mid: comment.mid,
              sign: comment.sign || '-',
            },
          })
        }}
      >
        {comment.name}
      </Text>
      <Text className={fontSize}>
        {comment.sex === '男' ? '♂：' : comment.sex === '女' ? '♀：' : '：'}
      </Text>
      {'top' in comment && comment.top ? (
        <Text className={`text-sm font-bold ${colors.secondary.text}`}>{' 置顶 '}</Text>
      ) : null}
      {comment.message?.length ? (
        <CommentText
          textClassName={clsx(fontSize, comment.upLike && 'font-bold')}
          nodes={comment.message}
          idStr={`${comment.id}_`}
        />
      ) : null}
      {'time' in comment && comment.time ? (
        <Text className={`text-xs ${colors.gray6.text}`}> {comment.time.replace('发布', '')} </Text>
      ) : null}
      {comment.like ? (
        <Text className={`text-xs ${colors.secondary.text} ${comment.upLike ? 'font-bold' : ''}`}>
          {` ${comment.like}${comment.upLike ? '+UP👍' : ''}`}
        </Text>
      ) : null}
      {'images' in comment && comment.images?.length ? (
        <Text
          className={colors.primary.text}
          onPress={() => {
            if (comment.images) {
              setImagesList(comment.images)
              setCurrentImageIndex(0)
            }
          }}
        >
          {`  查看图片${comment.images.length > 1 ? `(${comment.images.length})` : ''}`}
        </Text>
      ) : null}
    </Text>
  )
}

export const Comment = CommentBlock

function CommentBlock(props: { comment: CommentItemType; className?: string }) {
  const { comment } = props
  const { setRepliesInfo } = useStore()

  return (
    <View className={clsx([comment.replies?.length ? 'mb-7' : 'mb-4', props.className])}>
      <CommentItem comment={comment} />
      {comment.replies?.length ? (
        <View className="mt-1 flex-1 shrink-0 gap-1 rounded border-gray-500 bg-neutral-200 p-2 opacity-90 dark:bg-neutral-900">
          {comment.replies.map(reply => {
            return <CommentItem key={reply.id} comment={reply} smallFont />
          })}
          {comment.moreText && comment.rcount > comment.replies.length ? (
            <Button
              type="clear"
              size="sm"
              onPress={() => {
                setRepliesInfo({
                  oid: comment.oid,
                  type: comment.type,
                  root: comment.replies[0].root_str,
                })
                // setMoreRepliesUrl(
                //   `https://www.bilibili.com/h5/comment/sub?oid=${comment.oid}&pageType=${comment.type}&root=${root}`,
                // )
              }}
              buttonClassName="justify-start p-[1px]"
            >
              <Text className={colors.primary.text}>{`${comment.moreText}...`}</Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
