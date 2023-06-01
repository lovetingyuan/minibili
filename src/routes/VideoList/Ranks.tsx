import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { TracyId } from '../../constants'
import { FlashList } from '@shopify/flash-list'
import store, { useStore } from '../../store'

import { VideoItem } from '../../api/hot-videos'
import { handleShareVideo, openBiliVideo, parseNumber } from '../../utils'
import { useRankList } from '../../api/rank-list'
import { Skeleton } from '@rneui/themed'
import { Action, reportUserAction } from '../../utils/report'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

const VideoLoading = (props: { index: number; a: boolean }) => {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <Skeleton animation="pulse" width={'100%' as any} height={90} />
      <View style={{ gap: 8 }}>
        <Skeleton animation="pulse" width={'80%' as any} height={15} />
        {props.index % 2 ? (
          <Skeleton animation="pulse" width={'50%' as any} height={15} />
        ) : (
          <View style={{ height: 10 }} />
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Skeleton animation="pulse" width={60} height={12} />
        <Skeleton animation="pulse" width={50} height={12} />
      </View>
    </View>
  )
}
const Loading = React.memo(() => {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View
              style={{
                padding: 10,
                gap: 15,
                marginBottom: 10,
                marginTop: 10,
                flexDirection: 'row',
              }}
              key={i}>
              <VideoLoading index={i} a />
              <VideoLoading index={i} a={false} />
            </View>
          )
        })}
    </View>
  )
})

export default function Ranks({ navigation }: Props) {
  const videoListRef = React.useRef<any>(null)
  const { videosType, $blackUps } = useStore()
  const { data: list = [], isLoading, mutate } = useRankList(videosType?.rid)
  const [isRefreshing] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      try {
        videoListRef.current?.scrollToOffset({
          offset: 0,
        })
      } catch (err) {}
    })
    return unsubscribe
  }, [navigation])

  const currentVideoRef = React.useRef<VideoItem | null>(null)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    store.$blackUps['_' + mid] = name
    reportUserAction(Action.add_black_user, { mid, name })
  }
  const gotoPlay = (data: VideoItem) => {
    store.currentVideo = data
    navigation.navigate('Play')
  }
  const renderItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const key = item.bvid
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.itemContainer,
          {
            paddingLeft: index % 2 ? 5 : 8,
            paddingRight: index % 2 ? 8 : 5,
          },
        ]}
        key={key}
        onPress={() => gotoPlay(item)}
        onLongPress={() => {
          currentVideoRef.current = item
          store.overlayButtons = buttons()
        }}>
        <HotItem video={item} />
      </TouchableOpacity>
    )
  }

  const buttons = () =>
    [
      currentVideoRef.current?.mid == TracyId
        ? null
        : {
            text: `不再看 ${currentVideoRef.current?.name} 的视频`,
            onPress: () => {
              Alert.alert(
                `不再看 ${currentVideoRef.current?.name} 的视频？`,
                '',
                [
                  {
                    text: '取消',
                    style: 'cancel',
                  },
                  { text: '确定', onPress: addBlackUp },
                ],
              )
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
        text: '在B站打开',
        onPress: () => {
          if (!currentVideoRef.current) {
            return
          }
          openBiliVideo(currentVideoRef.current.bvid)
        },
      },
    ].filter(Boolean)
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

  const estimatedItemSize = width / 2 - 10

  return (
    <View style={styles.container}>
      <FlashList
        ref={v => {
          videoListRef.current = v
        }}
        numColumns={2}
        data={videoList}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <View>
            <Text style={styles.bottomEnd}>
              {isLoading ? '加载中...' : '到底了~'}
            </Text>
            {isLoading ? (
              <ActivityIndicator
                color="#00AEEC"
                animating
                size={'large'}
                style={{ marginTop: 30 }}
              />
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContainerStyle}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  listContainerStyle: { paddingTop: 14 },
  bottomEnd: {
    textAlign: 'center',
    color: '#555',
    marginTop: 10,
    marginBottom: 10,
  },

  videoCount: {
    fontSize: 16,
    marginRight: 20,
  },
  rankContainer: {
    margin: 10,
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
  },
  rankItem: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: 'pink',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankItemText: {
    fontSize: 18,
  },
})
