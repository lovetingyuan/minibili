import React from 'react'
import { View, FlatList, StyleSheet, useWindowDimensions } from 'react-native'
import { Text } from '@rneui/themed'
import FollowItem from './FollowItem'
import { UpInfo } from '../../types'
import { useStore } from '../../store'
import { checkUpdateUps } from '../../api/dynamic-items'
import commonStyles from '../../styles'
import AddFollow from './AddFollow'
import useMounted from '../../hooks/useMounted'

const renderItem = ({
  item,
}: // index,
{
  item: UpInfo | null
  index: number
}) => {
  if (item) {
    return <FollowItem item={item} />
  }
  return <View style={commonStyles.flex1} />
}

let firstRender = true

export default function Follow() {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const { $followedUps, $upUpdateMap, livingUps } = useStore()
  const followListRef = React.useRef<FlatList | null>(null)

  // 检查用户更新，由于组件会随路由重新创建，这里保证只运行一次
  useMounted(() => {
    if (firstRender) {
      checkUpdateUps(true)
      firstRender = false
      window.setInterval(() => {
        checkUpdateUps(false)
      }, 10 * 60 * 1000)
    }
  })

  const { width } = useWindowDimensions()
  const columns = Math.floor(width / 90)
  const followedUpListLen = $followedUps.length
  const rest = followedUpListLen
    ? columns - (followedUpListLen ? followedUpListLen % columns : 0)
    : 0

  let displayUps: (UpInfo | null)[] = []
  const topUps: UpInfo[] = []
  const updateUps: UpInfo[] = []
  const otherUps: UpInfo[] = []
  const updatedUps: Record<string, boolean> = {}
  for (const mid in $upUpdateMap) {
    updatedUps[mid] =
      $upUpdateMap[mid].latestId !== $upUpdateMap[mid].currentLatestId
  }
  for (const up of $followedUps) {
    if (livingUps[up.mid]) {
      topUps.push({ ...up })
    } else if (updatedUps[up.mid]) {
      updateUps.push({ ...up })
    } else {
      otherUps.push({ ...up })
    }
  }
  displayUps = [
    ...topUps,
    ...updateUps,
    ...otherUps,
    ...(rest ? Array.from({ length: rest }).map(() => null) : []),
  ]

  const emptyContent = () => {
    return <Text style={styles.emptyText}>暂无关注，请添加</Text>
  }

  return (
    <View style={styles.container}>
      <View style={commonStyles.flex1}>
        <FlatList
          data={displayUps}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item ? item.mid + '' : index + '')}
          onEndReachedThreshold={1}
          persistentScrollbar
          key={columns} // FlatList不支持直接更改columns
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
            $followedUps.length ? (
              <Text style={styles.bottomText}>到底了~</Text>
            ) : null
          }
        />
      </View>
      <AddFollow />
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

  emptyText: {
    textAlign: 'center',
    marginVertical: 100,
    fontSize: 18,
    lineHeight: 30,
  },
})
