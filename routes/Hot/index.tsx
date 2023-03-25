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
import { getHotList } from '../../services/Bilibili'
import HotItem from './HotItem'
// import TracyBtn from '../../components/TracyBtn'
import { handleShareVideo } from '../../services/Share'
import { GetFuncPromiseType } from '../../types'
import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { TracyId } from '../../constants'
// import useDialog from '../../hooks/useDialog'
import { FlashList } from '@shopify/flash-list'
import store from '../../store'
import { useSnapshot } from 'valtio'
// import { Switch } from '@rneui/base'

type Props = BottomTabScreenProps<RootStackParamList, 'Hot'>

type VideoItem = GetFuncPromiseType<typeof getHotList>['list'][0]

export default function Hot({ navigation }: Props) {
  const [state, setState] = React.useState<{
    page: number
    list: [VideoItem, VideoItem?][]
    refreshing: boolean
  }>({
    page: 1,
    list: [],
    refreshing: false,
  })
  const videosIdMap: Record<string, boolean> = {}
  state.list.forEach(item => {
    const [first, second] = item
    videosIdMap[first.bvid] = true
    if (second) {
      videosIdMap[second.bvid] = true
    }
  })
  const hotListRef = React.useRef<any>(null)
  const { blackUps, blackTags } = useSnapshot(store)

  React.useEffect(() => {
    navigation.setOptions({
      headerRight() {
        if (!state.list.length) {
          return null
        }
        return (
          <Text
            style={{
              fontSize: 16,
              marginRight: 20,
            }}>
            {state.list.length * 2}
          </Text>
        )
      },
    })
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return
      }
      state.list.length &&
        hotListRef.current?.scrollToOffset({
          offset: 0,
        })
    })
    return unsubscribe
  }, [navigation, state.list])

  const loadingRef = React.useRef(false)
  const moreRef = React.useRef(true)
  const currentVideoRef = React.useRef<VideoItem | null>(null)
  const [modalVisible, setModalVisible] = React.useState(false)
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    store.blackUps['_' + mid] = name
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { tag } = currentVideoRef.current
    store.blackTags[tag] = true
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
  const loadMoreHotItems = async () => {
    // console.log('loadr morer3-----------33');
    if (loadingRef.current || !moreRef.current) {
      return
    }
    loadingRef.current = true

    const { more, list: _list } = await getHotList(state.page).catch(() => {
      ToastAndroid.show('请求热门失败', ToastAndroid.SHORT)
      return { more: false, list: [] }
    })
    moreRef.current = more
    const last = state.list[state.list.length - 1]
    const list = _list.filter(v => {
      if (
        videosIdMap[v.bvid] || // videosIdMap 为了去重，有时候会有重复的视频
        v.tag in blackTags ||
        '_' + v.mid in blackUps
      ) {
        return false
      }
      return true
    })
    if (!list.length) {
      loadingRef.current = false
      setState({
        ...state,
        page: state.page + 1,
      })
      return
    }
    if (last && last.length === 1) {
      last.push(list.shift())
    }
    const viewList: [VideoItem, VideoItem?][] = []
    for (let i = 0; i < list.length; i = i + 2) {
      if (list[i + 1]) {
        viewList.push([list[i], list[i + 1]])
      } else {
        viewList.push([list[i]])
      }
    }
    const newList = state.list.concat(viewList)
    setState({
      ...state,
      page: state.page + 1,
      list: newList,
    })
    loadingRef.current = false
    SplashScreen.hideAsync()
  }
  const resetDynamicItems = () => {
    loadingRef.current = false
    moreRef.current = true
    setState({
      page: 1,
      list: [],
      refreshing: false,
    })
  }
  if (state.page === 1) {
    loadMoreHotItems()
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
  for (let [item1, item2] of state.list) {
    if (!('_' + item1.mid in blackUps) && !(item1.tag in blackTags)) {
      current.push(item1)
      if (current.length === 2) {
        hotVideoList.push(current as [VideoItem, VideoItem])
        current = []
      }
    }
    if (item2 && !('_' + item2.mid in blackUps) && !(item2.tag in blackTags)) {
      current.push(item2)
      if (current.length === 2) {
        hotVideoList.push(current as [VideoItem, VideoItem])
        current = []
      }
    }
  }
  if (current.length) {
    hotVideoList.push(current as [VideoItem, VideoItem?])
  }
  if (hotVideoList.length < 10) {
    setTimeout(loadMoreHotItems)
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
            {moreRef.current ? '加载中...' : '到底了~'}
          </Text>
        }
        onEndReached={loadMoreHotItems}
        onEndReachedThreshold={0.5}
        refreshing={state.refreshing}
        onRefresh={resetDynamicItems}
        contentContainerStyle={styles.listContainerStyle}
      />
      {/* <TracyBtn /> */}
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
})
