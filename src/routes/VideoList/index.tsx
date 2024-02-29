import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { PanResponder, View } from 'react-native'

import { RootStackParamList } from '@/types'

import { useStore } from '../../store'
import HotList from './HotList'
import Ranks from './Ranks'

export default React.memo(VideoList)

type Props = NativeStackScreenProps<RootStackParamList, 'VideoList'>

function VideoList({ navigation }: Props) {
  const { currentVideosCate } = useStore()
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        //return true if user is swiping, return false if it's a single click
        return !(gestureState.dx === 0 && gestureState.dy === 0)
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx < -59) {
          navigation.navigate('Follow')
        }
      },
    }),
  ).current
  return (
    <View {...panResponder.panHandlers} className="flex-1">
      {currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}
    </View>
  )
}
