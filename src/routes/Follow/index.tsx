import React from 'react'
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native'
import FollowItem from './FollowItem'
import Login from './Login'

import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store, { UserInfo } from '../../store'
import { useSnapshot } from 'valtio'
import Header from './Header'
import { FollowedUpItem, useFollowedUps } from '../../api/followed-ups'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name)
  const { $userInfo, $followedUps, livingUps, updatedUps, checkUpdateMap } =
    useSnapshot(store)
  const followListRef = React.useRef<FlatList | null>(null)

  const { data, error, isLoading } = useFollowedUps($userInfo?.mid)
  const showLoadingError = React.useRef(false)
  if (!showLoadingError.current && error) {
    ToastAndroid.show('获取关注列表失败', ToastAndroid.SHORT)
    showLoadingError.current = true
  }
  React.useEffect(() => {
    if (data?.list) {
      store.$followedUps = data.list
    }
  }, [data?.list])

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return
      }
      $followedUps.length &&
        followListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        })
    })
    return unsubscribe
  }, [navigation, $followedUps.length])

  const renderItem = ({ item }: { item: FollowedUpItem }) => {
    return <FollowItem item={item} />
  }

  if (!$userInfo) {
    return <Login />
  }

  const topUps: UserInfo[] = []
  const updateUps: UserInfo[] = []
  const noUpdateUps: UserInfo[] = []
  for (const up of $followedUps) {
    if (livingUps[up.mid]) {
      topUps.push({ ...up })
    } else if (updatedUps[up.mid]) {
      updateUps.push({ ...up })
    } else {
      noUpdateUps.push({ ...up })
    }
  }
  const displayUps = [...topUps, ...updateUps, ...noUpdateUps]
  const isCheckingUpdate =
    Object.values(checkUpdateMap).filter(Boolean).length > 0
  return (
    <View style={styles.container}>
      <Header />
      <View style={{ flex: 1 }}>
        {isCheckingUpdate ? (
          <ActivityIndicator color="blue" style={styles.loading} animating />
        ) : null}
        <FlatList
          data={displayUps}
          renderItem={renderItem}
          keyExtractor={item => item.mid + ''}
          onEndReachedThreshold={1}
          style={styles.list}
          ref={followListRef}
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
  list: {
    paddingTop: 18,
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
  loading: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
})
