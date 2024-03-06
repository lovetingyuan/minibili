import { Skeleton } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

const getWidth = () => Math.floor(Math.random() * (100 - 10 + 1)) + 10

function VideoLoading() {
  return (
    <View className="flex-1 gap-3">
      <Skeleton
        animation="pulse"
        // skeletonStyle={tw('bg-zinc-200')}
        width={'100%' as any}
        height={90}
      />
      <View className="gap-2">
        <Skeleton
          animation="wave"
          width={(getWidth() + '%') as any}
          height={15}
        />
        {Math.random() > 0.5 ? (
          <Skeleton
            animation="wave"
            width={(getWidth() + '%') as any}
            height={15}
          />
        ) : (
          <View className="h-3" />
        )}
      </View>
      <View className="flex-row justify-between">
        <Skeleton animation="wave" width={60} height={12} />
        <Skeleton animation="wave" width={50} height={12} />
      </View>
    </View>
  )
}

export default React.memo(VLoading)

function VLoading() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="px-2 py-1 gap-3 my-2 flex-row" key={i}>
              <VideoLoading />
              <VideoLoading />
            </View>
          )
        })}
    </View>
  )
}
