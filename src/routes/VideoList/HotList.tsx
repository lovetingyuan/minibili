import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Linking,
} from 'react-native'
// import * as SplashScreen from 'expo-splash-screen'
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { TracyId } from '../../constants'
import { FlashList } from '@shopify/flash-list'
import store, { useStore } from '../../store'
import Loading from './Loading'
import { useHotVideos, VideoItem } from '../../api/hot-videos'
import {
  handleShareVideo,
  openBiliVideo,
  parseNumber,
  showToast,
} from '../../utils'
import { Action, reportUserAction } from '../../utils/report'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

export default function Hot({ navigation }: Props) {
  const hotListRef = React.useRef<any>(null)
  const { $blackUps, $blackTags } = useStore()

  const {
    list,
    page,
    setSize,
    isRefreshing,
    loading,
    refresh,
    isReachingEnd,
    error,
  } = useHotVideos()

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      try {
        hotListRef.current?.scrollToOffset({
          offset: 0,
        })
      } catch (err) {}
    })
    return unsubscribe
  }, [navigation])

  React.useEffect(() => {
    if (error) {
      showToast('加载视频列表失败')
    }
  }, [error])

  const currentVideoRef = React.useRef<VideoItem | null>(null)
  // const [modalVisible, setModalVisible] = React.useState(false)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    store.$blackUps['_' + mid] = name
    reportUserAction(Action.add_black_user, { mid, name })
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { tag } = currentVideoRef.current
    store.$blackTags[tag] = tag
  }
  const gotoPlay = (data: VideoItem) => {
    navigation.navigate('Play', {
      bvid: data.bvid,
      video: data,
    })
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
      currentVideoRef.current?.mid == TracyId
        ? null
        : {
            text: `不再看 ${currentVideoRef.current?.tag} 类型的视频`,
            onPress: () => {
              Alert.alert(
                `不再看 ${currentVideoRef.current?.tag} 类型的视频？`,
                '',
                [
                  {
                    text: '取消',
                    style: 'cancel',
                  },
                  { text: '确定', onPress: addBlackTagName },
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
      {
        text: '查看封面',
        onPress: () => {
          if (!currentVideoRef.current) {
            return
          }
          Linking.openURL(currentVideoRef.current.cover)
        },
      },
    ].filter(Boolean)
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
  // if (hotVideoList.length || error) {
  //   try {
  //     SplashScreen.hideAsync()
  //   } catch (err) {}
  // }

  const { width } = useWindowDimensions()

  const estimatedItemSize = width / 2 - 10

  return (
    <View style={styles.container}>
      <FlashList
        ref={v => {
          hotListRef.current = v
        }}
        numColumns={2}
        data={hotVideoList}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {loading ? '加载中...' : isReachingEnd ? '到底了~' : ''}
          </Text>
        }
        onEndReached={() => {
          setSize(page + 1)
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        onRefresh={refresh}
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
    // paddingHorizontal: 8,
  },
  listContainerStyle: { paddingTop: 14 },
  bottomEnd: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 100,
    fontSize: 18,
    color: '#fb7299',
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
