import React from 'react'
import { Text, View, FlatList, StyleSheet } from 'react-native'
import FollowItem from './FollowItem'
import { getFollowUps } from '../../services/Bilibili'
// import TracyBtn from '../../components/TracyBtn'
import Login from './Login'

import { GetFuncPromiseType, RootStackParamList, UserInfo } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store from '../../store'
import { useSnapshot } from 'valtio'
import Header from './Header'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>
type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0]

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name)
  const { userInfo, livingUps, updatedUps } = useSnapshot(store)
  const [ups, setUps] = React.useState<UpItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [followedNum, setFollowedNum] = React.useState(0)
  const followListRef = React.useRef<FlatList | null>(null)

  React.useEffect(() => {
    if (!userInfo?.mid) {
      return
    }
    setLoading(true)
    getFollowUps(userInfo.mid)
      .then(({ list, total }) => {
        setFollowedNum(total)
        setUps(list)
      })
      .catch(() => {
        setFollowedNum(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userInfo?.mid])

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

  const renderItem = ({ item }: { item: UpItem }) => {
    return <FollowItem item={item} />
  }

  const clearUser = async () => {
    setUps([])
    setLoading(false)
    setFollowedNum(0)
    store.userInfo = null
    store.updatedUps = {}
    // store.specialUser = null
    store.dynamicUser = null
  }

  if (!userInfo) {
    return <Login />
  }

  const topUps: UserInfo[] = []
  const updateUps: UserInfo[] = []
  // if (specialUser) {
  //   topUps.push({ ...specialUser })
  // }
  const notUpdateUsers: UserInfo[] = []
  for (let up of ups) {
    // if (up.mid == specialUser?.mid) {
    //   continue
    // }
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
      {/* <TracyBtn /> */}
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
