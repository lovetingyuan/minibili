import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import React from 'react'
import HotList from './HotList'
import Ranks from './Ranks'
import { RootStackParamList } from '../../types'
import { useStore } from '../../store'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>
export default function (props: Props) {
  const { videosType } = useStore()
  if (videosType.rid === -1) {
    return <HotList {...props} />
  }
  return <Ranks {...props} />
}
