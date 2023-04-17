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
import { VideoItem } from '../../api/hot-videos'
import { handleShareVideo, openBiliVideo } from '../../utils'
import { useRankList } from '../../api/rank-list'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

export default function Ranks({ navigation }: Props) {
  const videoListRef = React.useRef<any>(null)
  const { videosType, $blackUps } = useSnapshot(store)
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
  const [modalVisible, setModalVisible] = React.useState(false)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    store.$blackUps['_' + mid] = name
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
    {
      text: `分享(${currentVideoRef.current?.shareNum})`,
      name: 'share',
    },
    {
      text: '在B站打开',
      name: 'openApp',
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
  if (videoList.length) {
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
          videoListRef.current = v
        }}
        numColumns={2}
        data={videoList}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        refreshing={isRefreshing}
        onRefresh={() => mutate()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
          </Text>
        }
        ListFooterComponent={
          <View>
            <Text style={styles.bottomEnd}>
              {isLoading ? '加载中...' : '到底了~'}
            </Text>
            {isLoading ? (
              <ActivityIndicator
                color="blue"
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
