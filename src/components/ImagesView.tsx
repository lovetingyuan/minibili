import { Overlay } from '@rn-vui/themed'
import { Image } from 'expo-image'
import React from 'react'
import {
  Linking,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'

import useLatest from '@/hooks/useLatest'
import { parseImgUrl } from '@/utils'

import { useStore } from '../store'
import Image2 from './Image2'
export default React.memo(ImagesView)

const textShadow = {
  textShadowColor: 'black',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 5,
}

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } =
    useStore()

  const { width, height } = useWindowDimensions()
  const images = imagesList.map((v) => {
    return {
      url: parseImgUrl(v.src),
      width: v.width,
      height: v.height,
    }
  })
  const [current, setCurrent] = React.useState(currentImageIndex)
  const onClose = () => {
    setImagesList([])
    setCurrentImageIndex(0)
  }
  const onOpen = () => {
    const img = imagesList[current].src
    Linking.openURL(img.split('@')[0])
  }
  // avoid view pager render all pages at same time.
  const imageCompCache = useLatest<
    Record<string, React.ComponentElement<any, any>>
  >({})
  // const imageCompCache = React.useRef<
  //   Record<string, React.ComponentElement<any, any>>
  // >({})
  const imageNodes = React.useMemo(() => {
    return images.map((v, i) => {
      let imgWidth = Math.min(width, v.width)
      let imgHeight = (imgWidth * v.height) / v.width
      let overflow = false
      if (imgHeight > height) {
        imgWidth = width
        imgHeight = (width * v.height) / v.width
        overflow = true
        // imgHeight = Math.min(height, v.height)
        // imgWidth = (v.width * imgHeight) / v.height
      }
      let imageView = null
      if (imageCompCache.current[v.url]) {
        imageView = imageCompCache.current[v.url]
      } else if (current === i) {
        Object.assign(imageCompCache.current, {
          [v.url]: (
            <Image2
              source={{ uri: v.url }}
              // initWidth={96}
              // initHeight={96}
              style={{ width: imgWidth, height: imgHeight }}
              placeholder={require('../../assets/loading2.gif')}
            />
          ),
        })
        imageView = imageCompCache.current[v.url]
      } else {
        imageView = (
          <Image
            source={require('../../assets/loading2.gif')}
            className="h-24 w-24"
          />
        )
      }
      // if (overflow) {
      //   return (
      //     <ScrollView
      //       key={v.url}
      //       contentContainerStyle={tw('justify-center items-center')}
      //       className="flex-1 bg-white">
      //       {imageView}
      //     </ScrollView>
      //   )
      // }
      return (
        <View
          key={v.url}
          className="flex-1 items-center justify-center bg-black">
          {overflow ? (
            <ScrollView
              key={v.url}
              contentContainerStyle={tw('justify-center items-center')}
              className="flex-1 bg-black">
              {imageView}
            </ScrollView>
          ) : (
            imageView
          )}
        </View>
      )
    })
  }, [images, width, height, imageCompCache, current])
  return (
    <Overlay
      isVisible={images.length > 0}
      fullScreen
      overlayStyle={tw('p-0 m-0')}
      onBackdropPress={onClose}>
      <View className="relative flex-1">
        <View className="absolute top-6 z-10 w-full justify-center">
          <Text className="text-center text-lg text-white" style={textShadow}>
            {current + 1} / {images.length}
          </Text>
        </View>
        <View className="absolute top-5 z-10 w-full flex-row items-center justify-end">
          <Text
            className="mr-4 text-right text-2xl font-semibold text-white"
            onPress={onOpen}
            style={textShadow}>
            ⇩
          </Text>
          <Text
            className="mr-4 text-right text-2xl text-white"
            onPress={onClose}
            style={textShadow}>
            ✕
          </Text>
        </View>
        <PagerView
          onPageSelected={(e) => {
            setCurrent(e.nativeEvent.position)
          }}
          offscreenPageLimit={1}
          className="flex-1"
          initialPage={currentImageIndex}>
          {imageNodes}
        </PagerView>
      </View>
    </Overlay>
  )
}
