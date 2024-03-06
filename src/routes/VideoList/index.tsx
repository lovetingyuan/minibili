import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { View } from 'react-native'

import { RootStackParamList } from '@/types'

import { useStore } from '../../store'
import HotList from './HotList'
import Ranks from './Ranks'
export default React.memo(VideoList)

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VideoList({ navigation }: Props) {
  const { currentVideosCate } = useStore()
  // const panResponder = React.useRef(
  //   PanResponder.create({
  //     onStartShouldSetPanResponder: () => true,
  //     onMoveShouldSetPanResponder: (evt, gestureState) => {
  //       const { dx, dy } = gestureState
  //       console.log('a', Date.now(), dx, dy)
  //       return Math.abs(dx) > 2 // || Math.abs(dy) > 2
  //       // return dx > 2 || dx < -2 || dy > 2 || dy < -2
  //       // //return true if user is swiping, return false if it's a single click
  //       // return !(gestureState.dx === 0 && gestureState.dy === 0)
  //     },
  //     onPanResponderRelease: (e, gestureState) => {
  //       console.log('b', Date.now(), dx, dy)

  //       // console.log(gestureState)
  //       if (gestureState.dx < -59 && Math.abs(gestureState.dy) < 20) {
  //         navigation.navigate('Follow')
  //       }
  //     },
  //   }),
  // ).current

  return (
    <View className="flex-1">
      {currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}
    </View>
  )
  // return (
  //   <View {...panResponder.panHandlers} className="flex-1">
  //     {currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}
  //   </View>
  // )
}
