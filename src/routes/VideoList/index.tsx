import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'

import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import HotList from './HotList'
import Ranks from './Ranks'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>
// rounded font-bold
export default React.memo(function (props: Props) {
  const { currentVideosCate } = useStore()
  if (currentVideosCate.rid === -1) {
    return <HotList {...props} />
  }
  return <Ranks {...props} />
})
