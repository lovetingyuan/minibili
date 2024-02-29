import React from 'react'
import { Text, View } from 'react-native'

import { useRankList } from '../../api/rank-list'
import { useStore } from '../../store'
import VideoList from './VideoList'

export default React.memo(Ranks)

function Ranks() {
  const { currentVideosCate } = useStore()
  const {
    data: list = [],
    isLoading,
    mutate,
  } = useRankList(currentVideosCate?.rid)
  return (
    <VideoList
      videos={list}
      isRefreshing={isLoading}
      onRefresh={() => mutate()}
      type="Rank"
      footer={
        <View>
          <Text className="text-center my-3 text-gray-500">
            {isLoading ? '加载中...' : '到底了~'}
          </Text>
        </View>
      }
    />
  )
}
