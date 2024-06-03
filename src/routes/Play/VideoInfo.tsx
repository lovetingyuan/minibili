import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { Avatar, BottomSheet, Card, Icon, Text } from '@rneui/themed'
import clsx from 'clsx'
import { Image } from 'expo-image'
import React from 'react'
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'

import { useWatchingCount } from '@/api/watching-count'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { useCollectedVideosMap } from '@/store/derives'
import type { NavigationProps, RootStackParamList } from '@/types'
import {
  handleShareVideo,
  parseDate,
  parseDuration,
  parseImgUrl,
  parseNumber,
  showToast,
} from '@/utils'

import { useVideoInfo } from '../../api/video-info'

export default React.memo(VideoInfo)

function VideoInfo(props: {
  currentPage: number
  setCurrentPage: (p: number) => void
}) {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data, isLoading } = useVideoInfo(route.params.bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const { name, face, mid, date, title, desc, pages } = videoInfo
  let videoDesc = desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (videoDesc && videoDesc === title) {
    videoDesc = ''
  }
  const [showPagesModal, setShowPagesModal] = React.useState(false)

  const navigation = useNavigation<NavigationProps['navigation']>()
  const watchingCount = useWatchingCount(videoInfo.bvid, videoInfo.cid)
  const { set$collectedVideos, get$collectedVideos, $blackUps } = useStore()
  const _collectedVideosMap = useCollectedVideosMap()
  const isCollected = videoInfo.bvid && videoInfo.bvid in _collectedVideosMap
  const isBlackUp = videoInfo.mid && `_${videoInfo.mid}` in $blackUps
  const collectVideo = () => {
    if (typeof videoInfo?.collectNum !== 'number') {
      return
    }
    if (isCollected) {
      Alert.alert('是否取消收藏？', '', [
        {
          text: '否',
        },
        {
          text: '是',
          onPress: () => {
            const list = get$collectedVideos()
            set$collectedVideos(list.filter((vi) => vi.bvid !== videoInfo.bvid))
          },
        },
      ])
    } else {
      const list = get$collectedVideos()
      set$collectedVideos([
        {
          bvid: videoInfo.bvid,
          name: videoInfo.name!,
          title: videoInfo.title,
          cover: videoInfo.cover!,
          date: videoInfo.date!,
          duration: videoInfo.duration!,
          mid: videoInfo.mid!,
        },
        ...list,
      ])
      showToast('已收藏')
    }
  }
  return (
    <View>
      <View className="items-center flex-wrap justify-between shrink-0 gap-3">
        {videoInfo?.argument ? (
          <View className="p-2 self-start">
            <Text
              className={`${colors.warning.text}`}
              onPress={() => {
                if (videoInfo.argumentLink) {
                  Linking.openURL(videoInfo.argumentLink)
                }
              }}>
              ⚠️ {videoInfo.argument}
            </Text>
          </View>
        ) : null}
        <View className="justify-between flex-row">
          <Pressable
            onPress={() => {
              if (!mid || !face || !name) {
                return
              }
              const user = {
                mid,
                face,
                name,
                sign: '-',
              }
              navigation.push('Dynamic', { user })
            }}
            className="flex-row flex-1 items-center mr-1">
            <Avatar
              size={36}
              rounded
              source={
                face
                  ? {
                      uri: parseImgUrl(face, 80),
                    }
                  : require('../../../assets/loading.png')
              }
              ImageComponent={Image}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className={clsx(
                'ml-3 mr-1 grow text-base font-bold',
                isBlackUp && `line-through ${colors.gray4.text}`,
              )}>
              {name || ''}
            </Text>
          </Pressable>
          <View className="flex-row items-center gap-1 px-2 flex-none ml-1">
            <Icon name="date-range" size={16} />
            <Text className="text-sm">{parseDate(date, true)}</Text>
            <Text className="text-sm ml-1">
              {watchingCount
                ? `${watchingCount.total === '1' ? '壹' : watchingCount.total}人在看`
                : ' '}
            </Text>
          </View>
        </View>
        <View className="flex-row w-full my-1 justify-start flex-wrap opacity-80">
          <View className="flex-row items-center gap-1 pr-1 py-1">
            <Icon name="play-circle-outline" size={18} />
            <Text className="text-sm">{parseNumber(videoInfo?.playNum)}</Text>
          </View>
          <View className="flex-row items-center gap-1 px-2 py-1">
            <Icon name="chat-bubble-outline" size={16} />
            <Text className="text-sm">
              {parseNumber(videoInfo?.danmuNum)}弹
            </Text>
          </View>
          <Pressable
            className="flex-row items-center gap-1 px-2 py-1"
            onPress={() => {
              showToast(`${videoInfo?.likeNum} 点赞`)
            }}>
            <Icon name="thumb-up-off-alt" size={18} />
            <Text className="text-sm">{parseNumber(videoInfo?.likeNum)}</Text>
          </Pressable>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={collectVideo}
            className="flex-row items-center gap-1 px-2 py-1">
            <Icon
              name="star"
              size={18}
              color={
                tw(isCollected ? colors.warning.text : colors.gray8.text).color
              }
            />
            <Text
              className={clsx(
                'text-sm',
                isCollected
                  ? [colors.warning.text, 'font-bold']
                  : colors.gray8.text,
              )}>
              {parseNumber(videoInfo?.collectNum)}
            </Text>
          </TouchableOpacity>
          <Pressable
            className="flex-row items-center gap-1 pl-2 py-1"
            onPress={() => {
              if (name && title && route.params.bvid) {
                handleShareVideo(name, title, route.params.bvid)
              }
            }}>
            <Icon type="material-community" name="share" size={22} />
            <Text className="text-sm">{parseNumber(videoInfo?.shareNum)}</Text>
          </Pressable>
        </View>
      </View>
      <Text className="text-base mt-3">{title}</Text>
      {videoDesc ? (
        <Text className="mt-3" selectable>
          {videoDesc}
        </Text>
      ) : null}
      {pages && pages.length > 1 ? (
        <View className="flex-row items-center mt-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className=" flex-1"
            onPress={() => {
              setShowPagesModal(true)
            }}>
            <Text
              className="text-base flex-1 flex-wrap "
              numberOfLines={1}
              ellipsizeMode="tail">
              视频分集【{props.currentPage}/{videoInfo?.pages?.length}】：
              <Text
                className={clsx(
                  colors.primary.text,
                  'text-base align-middle flex-wrap flex-1 border',
                )}>
                {pages[props.currentPage - 1].title}
              </Text>
            </Text>
          </TouchableOpacity>
          <BottomSheet
            onBackdropPress={() => {
              setShowPagesModal(false)
            }}
            modalProps={{
              onRequestClose: () => {
                setShowPagesModal(false)
              },
            }}
            isVisible={showPagesModal}>
            <Card containerStyle={tw('m-0')}>
              <Card.Title className="text-left text-lg">{`视频分集【${props.currentPage}/${pages.length}】`}</Card.Title>
              <Card.Divider />
              <ScrollView className="flex-1 max-h-[80vh]">
                {pages.map((item) => {
                  const selected = item.page === props.currentPage
                  return (
                    <TouchableOpacity
                      key={item.cid}
                      activeOpacity={0.8}
                      onPress={() => {
                        props.setCurrentPage(item.page)
                        // props.setCurrentCid(item.cid)
                        setShowPagesModal(false)
                      }}
                      className="py-2">
                      <Text
                        className={clsx(
                          'text-base',
                          selected && [colors.primary.text, 'font-bold'],
                        )}>
                        {item.page}. {item.title} (
                        {parseDuration(item.duration)})
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </Card>
          </BottomSheet>
        </View>
      ) : null}
      {!isLoading && videoInfo?.interactive ? (
        <Text className={`mt-3 italic ${colors.warning.text}`}>
          【该视频为交互视频，暂不支持】
        </Text>
      ) : null}
    </View>
  )
}
