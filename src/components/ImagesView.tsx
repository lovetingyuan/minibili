import { Overlay } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Linking, Text, useWindowDimensions, View } from 'react-native'
import PagerView from 'react-native-pager-view'

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
  const images = imagesList.map(v => {
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
  const imageCompCache = React.useRef<
    Record<string, React.ComponentElement<any, any>>
  >({})
  return (
    <Overlay
      isVisible={images.length > 0}
      fullScreen
      overlayStyle={tw('p-0 m-0')}
      onBackdropPress={onClose}>
      <View className="flex-1 relative">
        <View className="w-full justify-center absolute top-6 z-10">
          <Text className="text-center text-white text-lg" style={textShadow}>
            {current + 1} / {images.length}
          </Text>
        </View>
        <View className="w-full justify-end flex-row items-center absolute top-5 z-10">
          <Text
            className="text-right font-semibold text-white text-2xl mr-4"
            onPress={onOpen}
            style={textShadow}>
            ⇩
          </Text>
          <Text
            className="text-right text-white text-2xl mr-4"
            onPress={onClose}
            style={textShadow}>
            ✕
          </Text>
        </View>
        <PagerView
          onPageSelected={e => {
            setCurrent(e.nativeEvent.position)
          }}
          offscreenPageLimit={1}
          className="flex-1"
          initialPage={currentImageIndex}>
          {images.map((v, i) => {
            let imgWidth = Math.min(width, v.width)
            let imgHeight = (imgWidth * v.height) / v.width
            if (imgHeight > height) {
              imgHeight = Math.min(height, v.height)
              imgWidth = (v.width * imgHeight) / v.height
            }
            let imageView = null
            if (imageCompCache.current[v.url]) {
              imageView = imageCompCache.current[v.url]
            } else if (current === i) {
              imageCompCache.current[v.url] = (
                <Image2
                  source={{ uri: v.url }}
                  initWidth={96}
                  initHeight={96}
                  style={{ width: imgWidth, height: imgHeight }}
                  placeholder={require('../../assets/loading.gif')}
                />
              )
              imageView = imageCompCache.current[v.url]
            } else {
              imageView = (
                <Image
                  source={require('../../assets/loading.gif')}
                  className="w-24 h-24"
                />
              )
            }
            return (
              <View
                key={v.url}
                className="flex-1 bg-black justify-center items-center">
                {imageView}
              </View>
            )
          })}
        </PagerView>
      </View>
    </Overlay>
  )
}
