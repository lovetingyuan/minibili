import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import HotItem from './VideoItem'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { TracyId } from '../../constants'
import { FlashList } from '@shopify/flash-list'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { useHotVideos, VideoItem } from '../../api/hot-videos'
import { handleShareVideo, openBiliVideo } from '../../utils'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

export default function Hot({ navigation }: Props) {
  const hotListRef = React.useRef<any>(null)
  const { $blackUps, $blackTags } = useSnapshot(store)

  const { list, page, setSize, isRefreshing, loading, refresh, isReachingEnd } =
    useHotVideos()

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

  const currentVideoRef = React.useRef<VideoItem | null>(null)
  const [modalVisible, setModalVisible] = React.useState(false)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    store.$blackUps['_' + mid] = name
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { tag } = currentVideoRef.current
    store.$blackTags[tag] = tag
  }
  const gotoPlay = (data: VideoItem) => {
    store.currentVideo = data
    // const { mid, bvid, name, aid, face, cover, desc, title, pubDate } = data
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
          setModalVisible(true)
        }}>
        <HotItem video={item} />
      </TouchableOpacity>
    )
  }

  const handleOverlayClick = useMemoizedFn((action: string) => {
    if (action === 'black') {
      setModalVisible(false)
      Alert.alert(`不再看 ${currentVideoRef.current?.name} 的视频？`, '', [
        {
          text: '取消',
          style: 'cancel',
        },
        { text: '确定', onPress: addBlackUp },
      ])
    } else if (action === 'blackByTag') {
      Alert.alert(`不再看 ${currentVideoRef.current?.tag} 类型的视频？`, '', [
        {
          text: '取消',
          style: 'cancel',
        },
        { text: '确定', onPress: addBlackTagName },
      ])
    } else if (action === 'share') {
      if (currentVideoRef.current) {
        setModalVisible(false)
        const { name, title, bvid } = currentVideoRef.current
        handleShareVideo(name, title, bvid)
      }
    } else if (action === 'openApp') {
      if (!currentVideoRef.current) {
        return
      }
      setModalVisible(false)
      openBiliVideo(currentVideoRef.current.bvid)
    }
  })
  const buttons = [
    currentVideoRef.current?.mid == TracyId
      ? null
      : {
          text: `不再看 ${currentVideoRef.current?.name} 的视频`,
          name: 'black',
        },
    currentVideoRef.current?.mid == TracyId
      ? null
      : {
          text: `不再看 ${currentVideoRef.current?.tag} 类型的视频`,
          name: 'blackByTag',
        },
    {
      text: `分享(${currentVideoRef.current?.shareNum})`,
      name: 'share',
    },
    {
      text: '在B站打开',
      name: 'openApp',
    },
  ].filter(Boolean)
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
  if (hotVideoList.length) {
    try {
      SplashScreen.hideAsync()
    } catch (err) {}
  }

  const { width } = useWindowDimensions()

  const estimatedItemSize = width / 2 - 10

  return (
    <View style={styles.container}>
      <ButtonsOverlay
        visible={modalVisible}
        buttons={buttons}
        onPress={handleOverlayClick}
        dismiss={() => setModalVisible(false)}
      />
      <FlashList
        ref={v => {
          hotListRef.current = v
        }}
        numColumns={2}
        data={hotVideoList}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
          </Text>
        }
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
