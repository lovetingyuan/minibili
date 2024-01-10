import React from 'react'
import HotList from './HotList'
import Ranks from './Ranks'
import { RootStackParamList } from '../../types'
import { useStore } from '../../store'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>
// rounded font-bold mm
export default React.memo(function (props: Props) {
  const { currentVideosCate } = useStore()
  if (currentVideosCate.rid === -1) {
    return <HotList {...props} />
  }
  return <Ranks {...props} />
})
