import React from 'react'
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ToastAndroid,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import FollowItem from './FollowItem'
import Login from './Login'

import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import store from '../../store'
import { useSnapshot } from 'valtio'
import Header from './Header'
import { FollowedUpItem, useFollowedUps } from '../../api/followed-ups'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name)
  const { $userInfo, $followedUps, livingUps, updatedUps, checkingUpdateMap } =
    useSnapshot(store)
  const followListRef = React.useRef<FlatList | null>(null)

  const { data, error, isLoading } = useFollowedUps($userInfo?.mid)
  const showLoadingError = React.useRef(false)
  if (!showLoadingError.current && error) {
    ToastAndroid.show('获取关注列表失败', ToastAndroid.SHORT)
    showLoadingError.current = true
  }
  if (!store.$followedUps.length && data?.list.length) {
    store.$followedUps = data.list
  }
  const { width } = useWindowDimensions()
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
    return <View style={{ flex: 1, marginHorizontal: 10 }} />
  }

  if (!$userInfo) {
    return <Login />
  }

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
  const displayUps: (FollowedUpItem | null)[] = [
    ...topUps,
    ...updateUps,
    ...noUpdateUps,
  ]
  if (rest) {
    displayUps.push(...Array.from({ length: rest }).map(() => null))
  }
  const isCheckingUpdate =
    Object.values(checkingUpdateMap).filter(Boolean).length > 0

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
          keyExtractor={(item, index) => (item ? item.mid + '' : index + '')}
          onEndReachedThreshold={1}
          numColumns={columns}
          ref={followListRef}
          columnWrapperStyle={{
            // borderWidth: 1,
            paddingHorizontal: 10,
            // alignItems: 'flex-start',
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
