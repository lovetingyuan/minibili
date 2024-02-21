import { Skeleton } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

const getWidth = () => Math.floor(Math.random() * (100 - 10 + 1)) + 10

function VideoLoading() {
  return (
    <View className="flex-1 gap-3">
      <Skeleton animation="pulse" width={'100%' as any} height={90} />
      <View className="gap-2">
        <Skeleton
          animation="pulse"
          width={(getWidth() + '%') as any}
          height={15}
        />
        {Math.random() > 0.5 ? (
          <Skeleton
            animation="pulse"
            width={(getWidth() + '%') as any}
            height={15}
          />
        ) : (
          <View className="h-3" />
        )}
      </View>
      <View className="flex-row justify-between">
        <Skeleton animation="pulse" width={60} height={12} />
        <Skeleton animation="pulse" width={50} height={12} />
      </View>
    </View>
  )
}

export default React.memo(function VLoading() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="p-3 gap-4 my-3 flex-row" key={i}>
              <VideoLoading />
              <VideoLoading />
            </View>
          )
        })}
    </View>
  )
})
