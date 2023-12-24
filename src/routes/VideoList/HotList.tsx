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
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { FlashList } from '@shopify/flash-list'
import store, { useStore } from '../../store'
import Loading from './Loading'
import { useHotVideos, VideoItem } from '../../api/hot-videos'
import { handleShareVideo, parseNumber } from '../../utils'
import { Action, reportUserAction } from '../../utils/report'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FAB } from '@rneui/themed'
import useErrToast from '../../hooks/useErrToast'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

export default React.memo(function Hot({ navigation }: Props) {
  const hotListRef = React.useRef<any>(null)
  const { $blackUps, $blackTags } = useStore()
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
    mutate()
  }, [mutate])
  useErrToast('加载视频列表失败', error)

  const currentVideoRef = React.useRef<VideoItem | null>(null)
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
  const buttons = () => [
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
      text: `不再看 ${currentVideoRef.current?.tag} 类型的视频`,
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
        Linking.openURL(currentVideoRef.current.cover)
      },
    },
  ]
  const { width } = useWindowDimensions()
  const itemWidth = (width - 24) / 2
  const renderItem = ({ item }: { item: VideoItem }) => {
    const key = item.bvid
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.itemContainer]}
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

  return (
    <View style={styles.container}>
      <FlashList
        ref={v => {
          hotListRef.current = v
        }}
        key={'hot'}
        numColumns={2}
        data={hotVideoList}
        renderItem={renderItem}
        persistentScrollbar
        estimatedItemSize={itemWidth}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {loading
              ? `加载中(${list.length})...`
              : isReachingEnd
              ? `到底了(${list.length})~`
              : ''}
          </Text>
        }
        onEndReached={() => {
          setSize(page + 1)
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        contentContainerStyle={styles.listContainerStyle}
        estimatedFirstItemOffset={100}
      />
      <FAB
        visible
        color="#f25d8e"
        placement="right"
        icon={{ name: 'refresh', color: 'white' }}
        style={{
          bottom: 10,
          opacity: 0.8,
        }}
        size="small"
        onPress={() => {
          mutate()
          hotListRef.current?.scrollToOffset(0)
        }}
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
    // paddingHorizontal: 8,
  },
  listContainerStyle: { paddingTop: 14, paddingHorizontal: 4 },
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
