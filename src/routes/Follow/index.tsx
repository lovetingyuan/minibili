import React from 'react'
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  // ActivityIndicator,
  useWindowDimensions,
  Alert,
  Vibration,
} from 'react-native'
import FollowItem from './FollowItem'
import Login from './Login'

import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store, { useStore } from '../../store'

import Header from './Header'
import { FollowedUpItem, useFollowedUps } from '../../api/followed-ups'
import { useLivingInfo3 } from '../../api/living-info'
import { throttle } from 'throttle-debounce'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

const vibrate = throttle(
  5000,
  () => {
    Vibration.vibrate(1000)
  },
  {
    noLeading: false,
    noTrailing: false,
  },
)

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(111, route.name)
  const { $userInfo, $followedUps, livingUps, updatedUps, checkingUpdateMap } =
    useStore()
  const followListRef = React.useRef<FlatList | null>(null)

  const { data, error, isLoading } = useFollowedUps($userInfo?.mid)
  React.useEffect(() => {
    if (data?.total && data?.total / 50 > 5) {
      Alert.alert('系统限制最多只能加载前250个关注的UP')
    }
  }, [data?.total])

  React.useEffect(() => {
    if (error) {
      ToastAndroid.show(
        '获取关注列表失败（用户需要设置关注列表公开）',
        ToastAndroid.SHORT,
      )
    }
  }, [error])
  React.useEffect(() => {
    if (data?.list) {
      store.$followedUps = data?.list
    }
  }, [data?.list])

  const { width } = useWindowDimensions()
  const { data: livingMap, error: livingError } = useLivingInfo3()
  React.useEffect(() => {
    if (livingError) {
      ToastAndroid.show('检查直播失败', ToastAndroid.SHORT)
    }
  }, [livingError])
  React.useEffect(() => {
    livingMap &&
      Object.keys(livingMap).forEach(mid => {
        // https://live.bilibili.com/h5/24446464
        const { live_status, room_id } = livingMap[mid]
        const living = live_status === 1
        const url = 'https://live.bilibili.com/h5/' + room_id

        if (!!store.livingUps[mid] !== living) {
          store.livingUps[mid] = living ? url : ''
          if (living) {
            vibrate()
          }
        }
      })
  }, [livingMap])
  const columns = Math.floor(width / 90)
  const rest = data?.list.length ? data.list.length % columns : 0

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return
      }
      try {
        followListRef.current?.scrollToOffset({
          offset: 0,
        })
      } catch (err) {}
    })
    return unsubscribe
  }, [navigation])

  const renderItem = ({
    item,
  }: {
    item: FollowedUpItem | null
    index: number
  }) => {
    if (item) {
      return <FollowItem item={item} />
    }
    return <View style={{ flex: 1, marginHorizontal: 10, height: 20 }} />
  }
  if (!$userInfo) {
    return <Login />
  }

  const isCheckingUpdate =
    Object.values(checkingUpdateMap).filter(Boolean).length > 0

  let displayUps: (FollowedUpItem | null)[] = $followedUps.slice()
  if (!isCheckingUpdate) {
    const topUps: FollowedUpItem[] = []
    const updateUps: FollowedUpItem[] = []
    const noUpdateUps: FollowedUpItem[] = []
    for (const up of $followedUps) {
      if (livingUps[up.mid]) {
        topUps.push({ ...up })
      } else if (updatedUps[up.mid]) {
        updateUps.push({ ...up })
      } else {
        noUpdateUps.push({ ...up })
      }
    }
    displayUps = [
      ...topUps,
      ...updateUps,
      ...noUpdateUps,
      ...(rest ? Array.from({ length: rest }).map(() => null) : []),
    ]
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={{ flex: 1 }}>
        {/* {isCheckingUpdate ? (
          <ActivityIndicator color="blue" style={styles.loading} animating />
        ) : null} */}
        <FlatList
          data={displayUps}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item ? item.mid + '' : index + '')}
          onEndReachedThreshold={1}
          numColumns={columns}
          ref={followListRef}
          columnWrapperStyle={{
            paddingHorizontal: 10,
          }}
          contentContainerStyle={{
            paddingTop: 20,
          }}
          ListEmptyComponent={
            <Text style={styles.listEmptyText}>
              {isLoading
                ? '加载中...'
                : '暂无关注（需要在隐私设置中公开你的关注）'}
            </Text>
          }
          ListFooterComponent={
            <Text style={styles.bottomText}>{'到底了~'}</Text>
          }
        />
      </View>
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
    paddingBottom: 10,
    color: '#555',
    fontSize: 12,
  },

  listTitle: {
    fontSize: 16,
    marginTop: 18,
    marginBottom: 15,
  },

  listEmptyText: { textAlign: 'center', marginVertical: 40 },
  loading: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
})
