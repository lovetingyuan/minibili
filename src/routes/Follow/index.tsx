import React from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Text } from '@rneui/themed'
import FollowItem from './FollowItem'

import { RootStackParamList } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useStore } from '../../store'

import Header from './Header'
import { FollowedUpItem, getFollowedUps } from '../../api/followed-ups'
import { showToast } from '../../utils'
import { checkUpdateUps } from '../../api/dynamic-items'
import { useUserRelation } from '../../api/user-relation'
import { ApiError } from '../../api/fetcher'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>

export default React.memo(function Follow({ navigation }: Props) {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const { $userInfo, $followedUps, $upUpdateMap, livingUps } = useStore()
  const followListRef = React.useRef<FlatList | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  // const [error, setError] = React.useState('')
  const { data: relation } = useUserRelation($userInfo?.mid)

  React.useEffect(() => {
    if (!$userInfo?.mid) {
      return
    }
    let checkUpUpdateTimer: number | null = null
    setIsLoading(true)
    getFollowedUps($userInfo.mid)
      .then(
        total => {
          if (total > 250) {
            Alert.alert('系统限制最多只能加载前250个关注的UP')
          }
        },
        err => {
          if (err instanceof ApiError) {
            if (err.response.code === 22115) {
              showToast(err.response.message)
            } else {
              showToast('获取关注列表失败')
            }
          }
        },
      )
      .finally(() => {
        setIsLoading(false)
        checkUpdateUps(true)
        checkUpUpdateTimer = window.setInterval(() => {
          checkUpdateUps(false)
        }, 10 * 60 * 1000)
      })
    return () => {
      if (typeof checkUpUpdateTimer === 'number') {
        clearInterval(checkUpUpdateTimer)
      }
    }
  }, [$userInfo?.mid])

  const { width } = useWindowDimensions()
  const columns = Math.floor(width / 90)
  const followedUpListLen = $followedUps.length
  const rest = followedUpListLen
    ? columns - (followedUpListLen ? followedUpListLen % columns : 0)
    : 0
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
  }: // index,
  {
    item: FollowedUpItem | null
    index: number
  }) => {
    if (item) {
      return <FollowItem item={item} />
    }
    return <View style={{ flex: 1 }} />
  }

  let displayUps: (FollowedUpItem | null)[] = []
  const topUps: FollowedUpItem[] = []
  const updateUps: FollowedUpItem[] = []
  const noUpdateUps: FollowedUpItem[] = []
  const updatedUps: Record<string, boolean> = {}
  for (const mid in $upUpdateMap) {
    updatedUps[mid] =
      !!$upUpdateMap[mid].latestId &&
      $upUpdateMap[mid].latestId !== $upUpdateMap[mid].currentLatestId
  }
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

  const emptyContent = () => {
    if (isLoading) {
      return (
        <View>
          <Text style={[styles.emptyText, { color: '#fb7299' }]}>
            哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
          </Text>
          <ActivityIndicator color="#00AEEC" animating size={'large'} />
        </View>
      )
    }
    if (relation?.following === 0) {
      return <Text style={styles.emptyText}>暂无关注</Text>
    }
    return (
      <Text style={styles.emptyText}>
        无法获取关注列表{'\n'}（需要在隐私设置中公开你的关注）
      </Text>
    )
  }

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
          ListEmptyComponent={emptyContent()}
          ListFooterComponent={
            <Text style={styles.bottomText}>
              {isLoading ? '加载中...' : $followedUps.length ? '到底了~' : ''}
            </Text>
          }
        />
      </View>
    </View>
  )
})

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
    lineHeight: 30,
  },
})
