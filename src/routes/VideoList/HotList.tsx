import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FAB } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import {
  Alert,
  Dimensions,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { colors } from '@/constants/colors.tw'

import { useHotVideos, type VideoItem } from '../../api/hot-videos'
import useErrToast from '../../hooks/useErrToast'
import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import { handleShareVideo, parseNumber, parseUrl } from '../../utils'
import { Action, reportUserAction } from '../../utils/report'
import Loading from './Loading'
import HotItem from './VideoItem'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

let refreshTime = Date.now()

export default React.memo(function Hot({ navigation }: Props) {
  const hotListRef = React.useRef<any>(null)
  const {
    $blackUps,
    $blackTags,
    set$blackTags,
    set$blackUps,
    setOverlayButtons,
  } = useStore()
  const {
    list,
    page,
    setSize,
    isRefreshing,
    loading,
    mutate,
    isReachingEnd,
    error,
  } = useHotVideos()
  React.useEffect(() => {
    if (Date.now() - refreshTime > 5 * 60 * 1000) {
      mutate()
      refreshTime = Date.now()
    }
  }, [mutate])
  useErrToast('加载视频列表失败', error)

  const currentVideoRef = React.useRef<VideoItem | null>(null)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    set$blackUps({
      ...$blackUps,
      ['_' + mid]: name,
    })
    reportUserAction(Action.add_black_user, { mid, name })
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { tag } = currentVideoRef.current
    set$blackTags({
      ...$blackTags,
      [tag]: tag,
    })
  }
  const gotoPlay = (data: VideoItem) => {
    navigation.navigate('Play', {
      aid: data.aid,
      bvid: data.bvid,
      title: data.title,
      desc: data.desc,
      mid: data.mid,
      face: data.face,
      name: data.name,
      cover: data.cover,
      date: data.date,
      tag: data.tag,
      // video: data,
    })
  }
  const buttons = () => [
    {
      text: `不再看「${currentVideoRef.current?.name}」的视频`,
      onPress: () => {
        Alert.alert(`不再看 ${currentVideoRef.current?.name} 的视频？`, '', [
          {
            text: '取消',
            style: 'cancel',
          },
          { text: '确定', onPress: addBlackUp },
        ])
      },
    },
    {
      text: `不再看「${currentVideoRef.current?.tag}」类型的视频`,
      onPress: () => {
        Alert.alert(`不再看 ${currentVideoRef.current?.tag} 类型的视频？`, '', [
          {
            text: '取消',
            style: 'cancel',
          },
          { text: '确定', onPress: addBlackTagName },
        ])
      },
    },
    {
      text: `分享(${parseNumber(currentVideoRef.current?.shareNum)})`,
      onPress: () => {
        if (currentVideoRef.current) {
          const { name, title, bvid } = currentVideoRef.current
          handleShareVideo(name, title, bvid)
        }
      },
    },
    {
      text: '查看封面',
      onPress: () => {
        if (!currentVideoRef.current) {
          return
        }
        Linking.openURL(parseUrl(currentVideoRef.current.cover))
      },
    },
  ]
  const renderItem = ({ item }: { item: VideoItem }) => {
    const key = item.bvid
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-1 flex-row justify-around mx-1 my-2"
        key={key}
        onPress={() => gotoPlay(item)}
        onLongPress={() => {
          currentVideoRef.current = item
          setOverlayButtons(buttons())
        }}>
        <HotItem video={item} />
      </TouchableOpacity>
    )
  }
  const hotVideoList: VideoItem[] = []
  const uniqVideosMap: Record<string, boolean> = {}
  for (const item of list) {
    if (!('_' + item.mid in $blackUps) && !(item.tag in $blackTags)) {
      if (item.bvid in uniqVideosMap) {
        continue
      }
      uniqVideosMap[item.bvid] = true
      hotVideoList.push(item)
    }
  }
  return (
    <View className="flex-1">
      {/* <View><View className="bg-red-500 w-[50vw] h-3 border" /></View> */}
      {/* <Text className="bg-red-300 h-[33vh] w-[50vw]">
        sdf: {width} - {height}
      </Text> */}
      <FlashList
        ref={v => {
          hotListRef.current = v
        }}
        key={'hot'}
        numColumns={2}
        data={hotVideoList}
        renderItem={renderItem}
        persistentScrollbar
        estimatedItemSize={Dimensions.get('window').width / 2}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <Text className="text-center my-3 text-gray-500">
            {loading
              ? `加载中(${hotVideoList.length})...`
              : isReachingEnd
                ? `到底了(${hotVideoList.length})~`
                : ''}
          </Text>
        }
        onEndReached={() => {
          setSize(page + 1)
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        contentContainerStyle={tw('pt-4 px-1')}
        estimatedFirstItemOffset={100}
      />
      <FAB
        visible
        color={tw(colors.secondary.text).color}
        placement="right"
        icon={{ name: 'refresh', color: 'white' }}
        className="bottom-3 opacity-90"
        size="small"
        onPress={() => {
          hotListRef.current?.scrollToOffset(0)
          setTimeout(() => {
            mutate()
          }, 50)
        }}
      />
    </View>
  )
})
