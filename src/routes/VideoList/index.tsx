import React, { useMemo } from 'react'
import { View } from 'react-native'

import { useStore } from '../../store'
import HotList from './HotList'
import Ranks from './Ranks'
import {
  videoListHeaderLeft,
  videoListHeaderRight,
  videoListHeaderTitle,
} from './Header'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

export default React.memo(VideoList)

function VideoList() {
  const { currentVideosCate } = useStore()
  useUpdateNavigationOptions(
    useMemo(() => {
      return {
        headerLeft: videoListHeaderLeft,
        headerTitleAlign: 'left',
        headerTitle: videoListHeaderTitle,
        headerRight: videoListHeaderRight,
      }
    }, []),
  )

  return (
    <View className="flex-1">
      {currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}
    </View>
  )
}
