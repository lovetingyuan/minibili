import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { View } from 'react-native'

import type { RootStackParamList } from '@/types'

import { useStore } from '../../store'
import HotList from './HotList'
import Ranks from './Ranks'
// import Test from './Test'
export default React.memo(VideoList)

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VideoList({ navigation }: Props) {
  const { currentVideosCate } = useStore()
  // return <Test />
  return (
    <View className="flex-1">
      {currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}
    </View>
  )
}
