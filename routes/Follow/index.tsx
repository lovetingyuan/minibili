import React from 'react'
import { Text, View, FlatList, StyleSheet, ToastAndroid } from 'react-native'
import FollowItem from './FollowItem'
import Login from './Login'

import { RootStackParamList, UserInfo } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store from '../../store'
import { useSnapshot } from 'valtio'
import Header from './Header'
import { FollowedUpItem, useFollowedUps } from '../../services/api/followed-ups'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>
// type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0]

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name)
  const { userInfo, livingUps, updatedUps } = useSnapshot(store)
  const [ups, setUps] = React.useState<FollowedUpItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [followedNum, setFollowedNum] = React.useState(0)
  const followListRef = React.useRef<FlatList | null>(null)

  const { data, error } = useFollowedUps(userInfo?.mid)
  // if (userInfo?.mid) {
  //   if (error) {
  //     ToastAndroid.show('获取关注列表失败', ToastAndroid.SHORT)
  //     setFollowedNum(0)
  //     setUps([...store.followedUps])
  //   } else if (data?.list) {
  //     setUps(data.list)
  //     setFollowedNum(data.total)
  //     store.followedUps = [...data.list]
  //   }
  // }

  React.useEffect(() => {
    if (userInfo?.mid) {
      if (error) {
        ToastAndroid.show('获取关注列表失败', ToastAndroid.SHORT)
        setFollowedNum(0)
        setUps([...store.followedUps])
      } else if (data?.list) {
        setUps(data.list)
        setFollowedNum(data.total)
        store.followedUps = [...data.list]
      }
    }
  }, [userInfo?.mid, error, data])

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return
      }
      ups.length &&
        followListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        })
    })
    return unsubscribe
  }, [navigation, ups])

  const renderItem = ({ item }: { item: FollowedUpItem }) => {
    return <FollowItem item={item} />
  }

  const clearUser = async () => {
    setUps([])
    setLoading(false)
    setFollowedNum(0)
    store.userInfo = null
    store.updatedUps = {}
    store.dynamicUser = null
  }

  if (!userInfo) {
    return <Login />
  }

  const topUps: UserInfo[] = []
  const updateUps: UserInfo[] = []
  const notUpdateUsers: UserInfo[] = []
  for (let up of ups) {
    if (livingUps[up.mid]) {
      topUps.push(up)
    } else if (updatedUps[up.mid]) {
      updateUps.push(up)
    } else {
      notUpdateUsers.push(up)
    }
  }
  const displayUps = [...topUps, ...updateUps, ...notUpdateUsers]

  return (
    <View style={styles.container}>
      <Header followedCount={followedNum} logOut={clearUser} />
      <FlatList
        data={displayUps}
        renderItem={renderItem}
        keyExtractor={item => item.mid + ''}
        onEndReachedThreshold={1}
        style={{
          paddingTop: 18,
        }}
        ref={followListRef}
        ListEmptyComponent={
          <Text style={styles.listEmptyText}>
            {loading
              ? '加载中...'
              : ups.length
              ? ''
              : '暂无关注（需要在隐私设置中公开你的关注）'}
          </Text>
        }
        ListFooterComponent={
          <Text style={styles.bottomText}>
            {loading ? '加载中...' : '到底了~'}
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  logo: {
    width: 160,
    height: 160,
  },
  bottomText: {
    textAlign: 'center',
    paddingBottom: 30,
    marginTop: 10,
    color: '#555',
    fontSize: 12,
  },

  listTitle: {
    fontSize: 16,
    marginTop: 18,
    marginBottom: 15,
  },

  listEmptyText: { textAlign: 'center', marginVertical: 40 },
})
