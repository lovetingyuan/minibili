import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import React from 'react'
import HotList from './HotList'
import Ranks from './Ranks'
import { RootStackParamList } from '../../types'
import { useStore } from '../../store'
// import { Text } from 'react-native'
// import * as SplashScreen from 'expo-splash-screen'

type Props = BottomTabScreenProps<RootStackParamList, 'VideoList'>
export default function (props: Props) {
  const { currentVideosCate } = useStore()
  // SplashScreen.hideAsync()
  // return null
  if (currentVideosCate.rid === -1) {
    return <HotList {...props} />
  }
  return <Ranks {...props} />
}
