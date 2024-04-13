import {
  ReactNativeZoomableView,
  ZoomableViewEvent,
} from '@openspacelabs/react-native-zoomable-view'
import { Image } from 'expo-image'
import React from 'react'
import { GestureResponderEvent, PanResponderGestureState } from 'react-native'
import PagerView from 'react-native-pager-view'
const images = [
  require('../../../assets/tv-l.png'),
  require('../../../assets/play.png'),
  require('../../../assets/ss.png'),
]

export default function Test() {
  const onShouldBlockNativeResponderHandler = (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState,
    zoomableViewEventObject: ZoomableViewEvent,
  ): boolean => {
    if (zoomableViewEventObject.zoomLevel === 1) {
      return false
    } else {
      return true
    }
  }
  const [current, setCurrent] = React.useState(0)

  return (
    <PagerView
      onPageSelected={e => {
        setCurrent(e.nativeEvent.position)
      }}
      offscreenPageLimit={1}
      className="flex-1"
      initialPage={0}>
      {images.map(img => {
        return (
          <ReactNativeZoomableView
            maxZoom={4}
            key={img}
            disablePanOnInitialZoom={true}
            onShouldBlockNativeResponder={onShouldBlockNativeResponderHandler}>
            <Image source={img} style={{ width: 100, height: 100 }} />
          </ReactNativeZoomableView>
        )
      })}
    </PagerView>
  )
}
