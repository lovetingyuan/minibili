import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import {
  // ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import type { VideoItem } from '../../api/hot-videos'
import { useRankList } from '../../api/rank-list'
import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import { handleShareVideo, parseNumber, parseUrl } from '../../utils'
import { Action, reportUserAction } from '../../utils/report'
import Loading from './Loading'
import HotItem from './VideoItem'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

export default React.memo(Ranks)

function Ranks({ navigation }: Props) {
  const videoListRef = React.useRef<any>(null)
  const { currentVideosCate, $blackUps, set$blackUps, setOverlayButtons } =
    useStore()
  const {
    data: list = [],
    isLoading,
    mutate,
  } = useRankList(currentVideosCate?.rid)
  const [isRefreshing] = React.useState(false)
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
  const gotoPlay = (data: VideoItem) => {
    navigation.navigate('Play', {
      aid: data.aid,
      bvid: data.bvid,
      title: data.title,
      desc: data.desc,
      mid: data.mid,
      cover: data.cover,
      face: data.face,
      name: data.name,
      date: data.date,
      tag: data.tag,
    })
  }
  const renderItem = ({ item }: { item: VideoItem; index: number }) => {
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

  const buttons = () => {
    return [
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
  }
  const videoList: VideoItem[] = []
  const uniqVideosMap: Record<string, boolean> = {}
  for (const item of list) {
    if (!('_' + item.mid in $blackUps)) {
      if (item.bvid in uniqVideosMap) {
        continue
      }
      uniqVideosMap[item.bvid] = true
      videoList.push(item)
    }
  }

  return (
    <View className="flex-1">
      <FlashList
        ref={v => {
          videoListRef.current = v
        }}
        key={currentVideosCate.rid}
        numColumns={2}
        data={videoList}
        renderItem={renderItem}
        persistentScrollbar
        estimatedItemSize={Dimensions.get('window').width / 2}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <View>
            <Text className="text-center my-3 text-gray-500">
              {isLoading ? '加载中...' : '到底了~'}
            </Text>
          </View>
        }
        contentContainerStyle={tw('px-1 pt-4')}
      />
    </View>
  )
}
