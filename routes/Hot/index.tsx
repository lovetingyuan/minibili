import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Alert,
  Linking,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import HotItem from './HotItem'
import { handleShareVideo } from '../../services/Share'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { TracyId } from '../../constants'
import { FlashList } from '@shopify/flash-list'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { useHotVideos, VideoItem } from '../../api/hot-videos'

type Props = BottomTabScreenProps<RootStackParamList, 'Hot'>

export default function Hot({ navigation }: Props) {
  const hotListRef = React.useRef<any>(null)
  const { $blackUps, $blackTags } = useSnapshot(store)

  const { list, page, setSize, isRefreshing, loading, refresh, isReachingEnd } =
    useHotVideos()

  React.useEffect(() => {
    // navigation.setOptions({
    //   headerRight() {
    //     if (!list.length) {
    //       return null
    //     }
    //     return <Text style={styles.videoCount}>{list.length}</Text>
    //   },
    // })
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      list.length &&
        hotListRef.current?.scrollToOffset({
          offset: 0,
        })
    })
    return unsubscribe
  }, [navigation, list])

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
  const renderItem = ({ item }: { item: [VideoItem, VideoItem?] }) => {
    const key = item[0].bvid + (item[1] ? item[1].bvid : 'n/a')
    return (
      <View key={key} style={styles.itemContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 1 }}
          onPress={() => {
            navigation.navigate('Play', {
              mid: item[0].mid,
              bvid: item[0].bvid,
              name: item[0].name,
              aid: item[0].aid,
            })
          }}
          onLongPress={() => {
            currentVideoRef.current = item[0]
            setModalVisible(true)
          }}>
          <HotItem video={item[0]} key={item[0].bvid} />
        </TouchableOpacity>
        {item[1] ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, marginLeft: 8 }}
            onPress={() => {
              navigation.navigate('Play', {
                mid: item[1]!.mid,
                bvid: item[1]!.bvid,
                name: item[1]!.name,
                aid: item[1]!.aid,
              })
            }}
            onLongPress={() => {
              currentVideoRef.current = item[1]!
              setModalVisible(true)
            }}>
            <HotItem video={item[1]} key={item[0].bvid} />
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
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
      Linking.openURL(`bilibili://video/${currentVideoRef.current.bvid}`).catch(
        err => {
          if (err.message.includes('No Activity found to handle Intent')) {
            ToastAndroid.show('未安装B站', ToastAndroid.SHORT)
          }
          navigation.navigate('WebPage', {
            title: currentVideoRef.current!.name + '的动态',
            url:
              'https://m.bilibili.com/video/' + currentVideoRef.current!.bvid,
          })
        },
      )
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
  const hotVideoList: [VideoItem, VideoItem?][] = []
  let current: [VideoItem?, VideoItem?] = []
  for (const item of list) {
    if (!('_' + item.mid in $blackUps) && !(item.tag in $blackTags)) {
      current.push(item)
      if (current.length === 2) {
        hotVideoList.push(current as [VideoItem, VideoItem])
        current = []
      }
    }
  }

  if (current.length) {
    hotVideoList.push(current as [VideoItem, VideoItem?])
  }
  if (hotVideoList.length) {
    SplashScreen.hideAsync()
  }
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
        data={hotVideoList}
        renderItem={renderItem}
        estimatedItemSize={200}
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
    paddingHorizontal: 8,
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
})
