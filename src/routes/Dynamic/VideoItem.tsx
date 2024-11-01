import { useNavigation } from '@react-navigation/native'
import { Icon, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import { useMarkVideoWatched } from '@/store/actions'

import type { DynamicItemType } from '../../api/dynamic-items'
import type { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { useStore } from '../../store'
import type { NavigationProps } from '../../types'
import {
  handleShareVideo,
  parseImgUrl,
  parseNumber,
  parseUrl,
} from '../../utils'

export default function VideoItem(props: {
  item: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_AV>
}) {
  const {
    item: {
      mid,
      name,
      payload: { cover, title, bvid, play, duration, desc, danmu },
      date,
      face,
      commentId,
      likeCount,
      // forwardCount,
    },
  } = props
  const { setOverlayButtons, $watchedVideos } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const gray = tw(colors.gray6.text).color
  const textStyle = {
    color: gray,
    fontSize: 13,
  }
  const nodes = props.item.desc?.rich_text_nodes
  const watchedInfo = $watchedVideos[bvid]
  const markWatchVideo = useMarkVideoWatched()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => {
        setOverlayButtons([
          {
            text: '分享',
            onPress: () => {
              handleShareVideo(name, title, bvid)
            },
          },
          {
            text: '标记观看完成',
            onPress: () => {
              markWatchVideo(
                {
                  bvid,
                  name,
                  title,
                  cover,
                  date,
                  duration,
                  mid,
                },
                100,
              )
            },
          },
          {
            text: '查看封面',
            onPress: () => {
              Linking.openURL(parseUrl(cover))
            },
          },
        ])
      }}
      onPress={() => {
        navigation.push('Play', {
          bvid,
          title,
          aid: commentId,
          mid,
          name,
          face,
          desc,
          cover,
          date,
        })
      }}>
      <RichTexts idStr={props.item.id} nodes={nodes} topic={props.item.topic} />

      <View className="flex-1 flex-row">
        <View className="mr-3 w-[45%] content-center justify-center">
          <Image
            className="aspect-[8/5] h-auto w-full rounded"
            source={{ uri: parseImgUrl(cover, 480, 300) }}
            loadingIndicatorSource={require('../../../assets/video-loading.png')}
          />
          <Image
            className="absolute h-12 w-14 self-center opacity-80"
            source={require('../../../assets/play.png')}
          />
          {watchedInfo ? (
            <View
              className={`absolute bottom-0 left-0 h-[6px] ${colors.secondary.bg}`}
              style={{ width: `${watchedInfo.watchProgress}%` }}
            />
          ) : null}
          <View
            className={`absolute bg-gray-900/70 px-1 py-[1px] ${watchedInfo ? 'bottom-1' : 'bottom-0'} left-0 m-1 rounded-sm`}>
            <Text className="text-xs font-thin text-white">{duration}</Text>
          </View>
          {/* <View className="absolute px-1 py-[1px] top-0 rounded-sm m-1 bg-gray-900/70">
            <Text className="text-xs font-thin text-white">{date}</Text>
          </View> */}
          <View
            className={`absolute px-1 py-[1px] ${watchedInfo ? 'bottom-1' : 'bottom-0'} right-0 m-1 rounded-sm bg-gray-900/70`}>
            <Text className="text-xs font-thin text-white">{danmu}弹</Text>
          </View>
        </View>
        <View className="flex-1 justify-around">
          <Text className="mb-3 flex-1 text-base" numberOfLines={3}>
            {title}
          </Text>
          <View className="min-w-20 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {play === undefined ? null : (
              <View className="flex-row items-center gap-1">
                <Icon name="play-circle-outline" size={15} color={gray} />
                <Text style={textStyle}>{play}</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Icon name="thumb-up-off-alt" size={15} color={gray} />
              <Text style={textStyle}>{parseNumber(likeCount)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="date-range" size={15} color={gray} />
              <Text style={textStyle}>{date}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
