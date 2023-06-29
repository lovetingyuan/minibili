import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native'
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { FlashList } from '@shopify/flash-list'
import store, { useStore } from '../../store'
import { VideoItem } from '../../api/hot-videos'
import { handleShareVideo, parseNumber } from '../../utils'
import { useRankList } from '../../api/rank-list'
import Loading from './Loading'
import { Action, reportUserAction } from '../../utils/report'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

export default React.memo(function Ranks({ navigation }: Props) {
  const videoListRef = React.useRef<any>(null)
  const { currentVideosCate, $blackUps } = useStore()
  const {
    data: list = [],
    isLoading,
    mutate,
  } = useRankList(currentVideosCate?.rid)
  const [isRefreshing] = React.useState(false)

  React.useEffect(() => {
    return navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      try {
        videoListRef.current?.scrollToOffset({
          offset: 0,
        })
      } catch (err) {}
    })
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
    navigation.navigate('Play', { video: data, bvid: data.bvid })
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
          store.overlayButtons = buttons
        }}>
        <HotItem video={item} />
      </TouchableOpacity>
    )
  }

  const buttons = React.useMemo(() => {
    return [
      {
        text: `不再看 ${currentVideoRef.current?.name} 的视频`,
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
          Linking.openURL(currentVideoRef.current.cover)
        },
      },
    ]
  }, [])
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
        persistentScrollbar
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
})

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
