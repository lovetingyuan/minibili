import { Text } from '@rneui/themed'
import React from 'react'
import {
  FlatList,
  Image,
  ImageBackground,
  useWindowDimensions,
  View,
} from 'react-native'

import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import useIsDark from '../../hooks/useIsDark'
import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'
import type { UpInfo } from '../../types'
import FollowItem from './FollowItem'
import { useUpUpdateCount } from '@/store/derives'

const tvL = require('../../../assets/tv-l.png')
const tvR = require('../../../assets/tv-r.png')

function TvImg() {
  const [tvImg, setTvImg] = React.useState(false)
  useMounted(() => {
    const timer = window.setInterval(() => {
      setTvImg(v => !v)
    }, 700)
    return () => {
      timer && window.clearInterval(timer)
    }
  })

  return (
    <Image
      source={tvImg ? tvL : tvR}
      className="aspect-square h-auto mt-12 self-center w-[50%]"
    />
  )
}

export default React.memo(FollowList)

function FollowList() {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const { $followedUps, $upUpdateMap, livingUps } = useStore()
  const _updatedCount = useUpUpdateCount()
  const followListRef = React.useRef<FlatList | null>(null)
  const dark = useIsDark()

  const { width } = useWindowDimensions()
  const columns = Math.floor(width / 90)
  const count = $followedUps.length
  const headerTitle =
    '关注的UP' +
    (count
      ? _updatedCount
        ? ` (${_updatedCount}/${count})`
        : ` (${count})`
      : '')
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        headerTitle,
      }
    }, [headerTitle]),
  )

  const renderItem = React.useCallback(
    ({
      item,
      index,
    }: // index,
    {
      item: UpInfo | null
      index: number
    }) => {
      if (item) {
        return <FollowItem item={item} index={index} />
      }
      return <View className="flex-1" />
    },
    [],
  )

  const content = React.useMemo(() => {
    const followedUpListLen = $followedUps.length
    const rest = followedUpListLen
      ? columns - (followedUpListLen ? followedUpListLen % columns : 0)
      : 0
    const pinUps: UpInfo[] = []
    const liveUps: UpInfo[] = []
    const updateUps: UpInfo[] = []
    const otherUps: UpInfo[] = []

    for (const up of $followedUps) {
      if (up.pin) {
        pinUps.push({ ...up })
      } else if (livingUps[up.mid]) {
        liveUps.push({ ...up })
      } else {
        if (
          up.mid in $upUpdateMap &&
          $upUpdateMap[up.mid].latestId !== $upUpdateMap[up.mid].currentLatestId
        ) {
          updateUps.push({ ...up })
        } else {
          otherUps.push({ ...up })
        }
      }
    }
    const displayUps = [
      ...pinUps.sort((a, b) => b.pin! - a.pin!),
      ...liveUps,
      ...updateUps,
      ...otherUps,
      ...(rest ? Array.from({ length: rest }).map(() => null) : []),
    ]

    return (
      <View className="flex-1">
        <FlatList
          data={displayUps}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item ? item.mid + '' : index + '')}
          onEndReachedThreshold={1}
          persistentScrollbar
          key={columns} // FlatList不支持直接更改columns
          numColumns={columns}
          ref={followListRef}
          columnWrapperStyle={tw('px-3')}
          contentContainerStyle={tw('pt-8')}
          ListEmptyComponent={
            <View>
              <TvImg />
              <Text className="text-center my-10 text-lg">
                暂无关注，请添加
              </Text>
            </View>
          }
          ListFooterComponent={
            $followedUps.length ? (
              <Text className="text-center pb-3 text-xs text-gray-500">
                到底了~
              </Text>
            ) : null
          }
        />
      </View>
    )
  }, [$followedUps, $upUpdateMap, livingUps, columns, renderItem])

  return (
    <View className="flex-1 flex-col">
      {dark ? (
        content
      ) : (
        <ImageBackground
          source={require('../../../assets/bg.webp')}
          resizeMode="cover"
          className="flex-1 justify-center">
          {content}
        </ImageBackground>
      )}
    </View>
  )
}
