import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Image, Linking, TouchableOpacity, View } from 'react-native'
import { NavigationProps } from '../../types'
import { DynamicItemType } from '../../api/dynamic-items'
import { Icon, Text, useTheme } from '@rneui/themed'
import { imgUrl, parseNumber, parseUrl } from '../../utils'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { useStore } from '../../store'

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
  const { setOverlayButtons } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()
  const gray = theme.colors.grey1
  const textStyle = {
    color: gray,
    fontSize: 13,
  }
  const nodes = props.item.desc?.rich_text_nodes

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => {
        setOverlayButtons([
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
          // date,
        })
      }}>
      <RichTexts idStr={props.item.id} nodes={nodes} topic={props.item.topic} />

      <View className="flex-1 flex-row">
        <View className="grow-[6] mr-3 justify-center content-center">
          <Image
            className="w-full rounded aspect-[8/5]"
            source={{ uri: imgUrl(cover, 480, 300) }}
            loadingIndicatorSource={require('../../../assets/video-loading.png')}
          />
          <Image
            className="w-14 h-12 absolute self-center"
            source={require('../../../assets/tv.png')}
          />
          <View className="absolute px-1 py-[1px] bg-gray-900/70 bottom-0 left-0 rounded-sm m-1">
            <Text className="text-xs font-bold text-white">{duration}</Text>
          </View>
          <View className="absolute px-1 py-[1px] top-0 rounded-sm m-1 bg-gray-900/70">
            <Text className="text-xs font-bold text-white">{date}</Text>
          </View>
          <View className="absolute px-1 py-[1px] bottom-0 right-0 m-1 rounded-sm bg-gray-900/70">
            <Text className="text-xs font-bold text-white">{danmu}弹</Text>
          </View>
        </View>
        <View className="grow-[5] justify-around">
          <Text className="flex-1 text-base mb-3" numberOfLines={3}>
            {title}
          </Text>
          <View className="flex-row shrink-0 min-w-20 items-center gap-x-3 flex-wrap">
            {play === undefined ? null : (
              <View className="flex-row items-center gap-1">
                <Icon name="play-circle-outline" size={15} color={gray} />
                <Text style={textStyle}>{play}</Text>
              </View>
            )}
            <View className="flex-row gap-1 items-center">
              <Icon name="thumb-up-off-alt" size={15} color={gray} />
              <Text style={textStyle}>{parseNumber(likeCount)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
