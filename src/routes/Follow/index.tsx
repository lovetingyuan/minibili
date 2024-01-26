import React from 'react'
import {
  View,
  FlatList,
  useWindowDimensions,
  Image,
  ImageBackground,
} from 'react-native'
import { Text } from '@rneui/themed'
import FollowItem from './FollowItem'
import { UpInfo } from '../../types'
import { useStore } from '../../store'
// import { s } from '../../styles'
import AddFollow from './AddFollow'
import useMounted from '../../hooks/useMounted'
import useIsDark from '../../hooks/useIsDark'

const renderItem = ({
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
}

const tvL = require('../../../assets/tv-l.png')
const tvR = require('../../../assets/tv-r.png')

const TvImg: React.FC = () => {
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
export default React.memo(function Follow() {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('Follow page')
  const { $followedUps, $upUpdateMap, livingUps } = useStore()
  const followListRef = React.useRef<FlatList | null>(null)
  const dark = useIsDark()

  const { width } = useWindowDimensions()
  const columns = Math.floor(width / 90)

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
      <>
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
        <AddFollow />
      </>
    )
  }, [$followedUps, $upUpdateMap, livingUps, columns])

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
})
