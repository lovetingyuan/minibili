import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import React from 'react'
import HotList from './HotList'
import Ranks from './Ranks'
import { RootStackParamList } from '../../types'
import { useSnapshot } from 'valtio'
import store from '../../store'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>

export default function (props: Props) {
  const { videosType } = useSnapshot(store)
  if (videosType.rid === -1) {
    return <HotList {...props} />
  }
  return <Ranks {...props} />
}
