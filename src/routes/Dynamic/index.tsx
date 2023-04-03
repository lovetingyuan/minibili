import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ToastAndroid,
  BackHandler,
  Image,
  useWindowDimensions,
} from 'react-native'
import ForwardItem from './ForwardItem'
import RichTextItem from './RichTextItem'
import VideoItem from './VideoItem'
import { RootStackParamList } from '../../types'
import WordItem from './WordItem'
import store from '../../store'
import { useSnapshot } from 'valtio'
import {
  DynamicItem,
  DynamicType,
  getDynamicItems,
} from '../../api/dynamic-items'
import { HeaderLeft, HeaderRight } from './Header'
import { useUserRelation } from '../../api/user-relation'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<RootStackParamList, 'Dynamic'>

const Dynamic: React.FC<Props> = function Dynamic({ navigation, route }) {
  __DEV__ && console.log(route.name)

  const [dynamicItems, setDynamicItems] = React.useState<DynamicItem[]>([])
  const pageInfoRef = React.useRef<{
    hasMore: boolean
    offset: string
    init?: boolean
  }>({
    hasMore: true,
    offset: '',
    init: true,
  })
  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const { dynamicUser } = useSnapshot(store)
  const upId = dynamicUser?.mid // || specialUser?.mid
  const dynamicListRef = React.useRef<FlatList | null>(null)
  const [initLoad, setInitLoad] = React.useState(true)
  const [refreshHead, setRefreshHead] = React.useState(0)
  const { data: fans } = useUserRelation(upId)
  const { width } = useWindowDimensions()
  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (!dynamicUser) {
          return '动态'
        }
        return (
          <View style={{ position: 'relative', left: -20 }}>
            <HeaderLeft
              user={dynamicUser}
              fans={fans?.follower}
              width={width}
              gotoWebPage={() => {
                navigation.navigate('WebPage', {
                  url: `https://space.bilibili.com/${dynamicUser.mid}`,
                  title: dynamicUser.name + '的主页',
                })
              }}
              scrollTop={() => {
                dynamicListRef.current?.scrollToIndex({
                  index: 0,
                })
              }}
            />
          </View>
        )
      },
      headerTitleAlign: 'left',
      // headerStyle: {
      //   flexWrap: 'wrap',
      // },
      headerRight: () => {
        if (!dynamicUser) {
          return null
        }
        return <HeaderRight user={dynamicUser} />
      },
    })
  }, [navigation, dynamicUser, fans, width])

  React.useEffect(() => {
    const handler = function () {
      if (route.params?.from === 'followed' && navigation.isFocused()) {
        navigation.navigate('Follow')
        return true
      }
      return false
    }
    BackHandler.addEventListener('hardwareBackPress', handler)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handler)
    }
  }, [upId, navigation, route.params])
  const renderItem = ({ item }: any) => {
    let Item: any = null
    if (item.type === DynamicType.Word) {
      Item = WordItem
    }
    if (item.type === DynamicType.Video) {
      Item = VideoItem
    }
    if (item.type === DynamicType.Draw) {
      Item = RichTextItem
    }
    if (
      item.type === DynamicType.ForwardDraw ||
      item.type === DynamicType.ForwardVideo ||
      item.type === DynamicType.ForwardOther
    ) {
      Item = ForwardItem
    }
    // https://m.bilibili.com/dynamic/710533241871794180?spm_id_from=333.999.0.0
    return (
      <View style={styles.itemContainer}>
        {item.top ? (
          <Image
            source={require('../../../assets/top.png')}
            style={{ width: 28.5, height: 14, marginBottom: 4 }}
          />
        ) : null}
        <Item {...item} />
      </View>
    )
  }
  const loadMoreDynamicItems = React.useCallback(() => {
    const { offset, hasMore } = pageInfoRef.current
    if (loading || !hasMore) {
      return
    }
    if (!upId) {
      return
    }
    setLoading(true)
    getDynamicItems(offset, upId)
      .then(
        ({ more, items, offset: os }) => {
          if (!pageInfoRef.current.offset) {
            setDynamicItems(items)
          } else {
            setDynamicItems(dynamicItems.concat(items))
          }
          pageInfoRef.current.hasMore = more
          pageInfoRef.current.offset = os
        },
        () => {
          ToastAndroid.show('请求动态失败', ToastAndroid.SHORT)
        },
      )
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [loading, upId, dynamicItems])
  const resetDynamicItems = () => {
    pageInfoRef.current = {
      hasMore: true,
      offset: '',
    }
    setLoading(false)
    setDynamicItems([])
    setInitLoad(true)
  }
  if (initLoad) {
    setInitLoad(false)
    loadMoreDynamicItems()
    setRefreshHead(refreshHead + 1)
  }
  React.useEffect(() => {
    resetDynamicItems()
  }, [upId])
  const headerProps = dynamicUser // || specialUser
  if (!headerProps) {
    return null
  }
  return (
    <View style={styles.container}>
      {/* <Header {...headerProps} /> */}
      <FlatList
        data={dynamicItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReachedThreshold={1}
        refreshing={refreshing}
        style={styles.listStyle}
        ref={dynamicListRef}
        onRefresh={resetDynamicItems}
        onEndReached={loadMoreDynamicItems}
        ListEmptyComponent={
          <>
            <Text style={styles.emptyText}>
              哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
            </Text>
            {loading ? (
              <Text style={{ textAlign: 'center' }}>加载中...</Text>
            ) : null}
          </>
        }
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {dynamicItems.length
              ? pageInfoRef.current.hasMore
                ? '加载中...'
                : '到底了~'
              : ''}
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  itemContainer: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
  },
  bottomEnd: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 20,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 100,
    marginBottom: 100,
    fontSize: 18,
    color: '#fb7299',
    textAlign: 'center',
  },
  listStyle: { paddingTop: 15 },
})

export default Dynamic
