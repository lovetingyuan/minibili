import React from 'react'
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  useWindowDimensions,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native'
import FollowItem from './FollowItem'

import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store, { useStore } from '../../store'

import Header from './Header'
import { FollowedUpItem, useFollowedUps } from '../../api/followed-ups'
import { useLivingInfo3 } from '../../api/living-info'
import { throttle } from 'throttle-debounce'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

const vibrate = throttle(
  10000,
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
  const { $userInfo, $followedUps, livingUps, updatedUps, checkingUpUpdate } =
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
    if (data?.list && store.$followedUps !== data.list) {
      store.$followedUps = data.list
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
    if (livingMap) {
      const livingMap2: Record<string, string> = {}
      Object.keys(livingMap).forEach(mid => {
        // https://live.bilibili.com/h5/24446464
        const { live_status, room_id } = livingMap[mid]
        const living = live_status === 1
        const url = 'https://live.bilibili.com/h5/' + room_id
        livingMap2[mid] = living ? url : ''
        if (living) {
          vibrate()
        }
      })
      store.livingUps = livingMap2
    }
  }, [livingMap])
  const columns = Math.floor(width / 90)
  const rest = columns - (data?.list.length ? data.list.length % columns : 0)
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
    return <View style={{ flex: 1 }} />
  }

  let displayUps: (FollowedUpItem | null)[] = $followedUps.slice()
  if (!checkingUpUpdate) {
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
  } else {
    displayUps.push(
      ...(rest ? Array.from({ length: rest }).map(() => null) : []),
    )
  }

  // if (__DEV__) {
  //   displayUps = displayUps.slice(0, 10)
  // }

  return (
    <View style={styles.container}>
      <Header />
      <View style={{ flex: 1 }}>
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
            paddingTop: 30,
          }}
          ListEmptyComponent={
            <Text style={styles.listEmptyText}>
              {isLoading ? (
                <View>
                  <Text style={styles.emptyText}>
                    哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
                  </Text>
                  <ActivityIndicator color="#00AEEC" animating size={'large'} />
                </View>
              ) : (
                '暂无关注（需要在隐私设置中公开你的关注）'
              )}
            </Text>
          }
          ListFooterComponent={
            <Text style={styles.bottomText}>
              {isLoading ? '加载中...' : displayUps.length ? '到底了~' : ''}
            </Text>
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
  emptyText: {
    textAlign: 'center',
    marginVertical: 100,
    fontSize: 18,
    color: '#fb7299',
  },
})
