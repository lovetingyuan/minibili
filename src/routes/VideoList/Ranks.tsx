import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native'
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { FlashList } from '@shopify/flash-list'
import { useStore } from '../../store'
import { VideoItem } from '../../api/hot-videos'
import { handleShareVideo, parseNumber, parseUrl } from '../../utils'
import { useRankList } from '../../api/rank-list'
import Loading from './Loading'
import { Action, reportUserAction } from '../../utils/report'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@rneui/themed'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

export default React.memo(function Ranks({ navigation }: Props) {
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
      bvid: data.bvid,
      title: data.title,
      desc: data.desc,
      mid: data.mid,
      face: data.face,
      name: data.name,
      date: data.date,
    })
  }
  const renderItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const key = item.bvid
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-1 flex-row justify-around ${
          index % 2 ? 'pl-1 pr-2' : 'pl-2 pr-1'
        }`}
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

  const { width } = useWindowDimensions()
  const { theme } = useTheme()

  const estimatedItemSize = width / 2 - 10

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
        estimatedItemSize={estimatedItemSize}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <View>
            <Text
              className="text-center my-3"
              style={{ color: theme.colors.grey3 }}>
              {isLoading ? '加载中...' : '到底了~'}
            </Text>
            {isLoading ? (
              <ActivityIndicator
                color="#00AEEC"
                animating
                size={'large'}
                className="mt-8"
              />
            ) : null}
          </View>
        }
        contentContainerStyle={tw('pt-4')}
      />
    </View>
  )
})
