// import { useNetInfo } from '@react-native-community/netInfo'
import { Overlay } from '@rneui/themed'
import { Asset } from 'expo-asset'
import { Image } from 'expo-image'
import React from 'react'
import {
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'

import { parseImgUrl } from '@/utils'

import { useStore } from '../store'

export default React.memo(ImagesView)

const textShadow = {
  textShadowColor: 'black',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 5,
}

function ImagesView() {
  const {
    imagesList,
    currentImageIndex,
    // setOverlayButtons,
    setImagesList,
    setCurrentImageIndex,
  } = useStore()

  // const netInfo = useNetInfo()
  const { width, height } = useWindowDimensions()
  // const isWiFi = netInfo.type === 'wifi'
  const images = imagesList.map(v => {
    // let url = v.src
    // if (!isWiFi) {
    //   url += `@${width * 0.8}w_${(width * 0.8 * v.height) / v.width}h_1c.webp`
    // }
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
  const {
    width: loadingWidth,
    height: loadingHeight,
    uri: loadingUri,
  } = Asset.fromModule(require('../../assets/loading.png'))
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
          className="flex-1"
          initialPage={currentImageIndex}>
          {images.map(v => {
            let imgWidth = Math.min(width, v.width)
            let imgHeight = (imgWidth * v.height) / v.width
            if (imgHeight > height) {
              imgHeight = Math.min(height, v.height)
              imgWidth = (v.width * imgHeight) / v.height
            }
            return (
              <Pressable
                // onLongPress={() => {
                //   setOverlayButtons(
                //     [
                //       {
                //         text: '浏览器查看（下载）',
                //         onPress: () => {
                //           Linking.openURL(v.url)
                //         },
                //       },
                //       v.url.includes('@')
                //         ? {
                //             text: '查看清晰版本',
                //             onPress: () => {
                //               Linking.openURL(v.url.split('@')[0])
                //             },
                //           }
                //         : null,
                //     ].filter(Boolean),
                //   )
                // }}
                key={v.url}
                className="flex-1 bg-black justify-center items-center">
                <Image
                  source={{ uri: v.url }}
                  style={{ width: imgWidth, height: imgHeight }}
                  placeholder={
                    typeof loadingWidth === 'number' &&
                    typeof loadingHeight === 'number'
                      ? {
                          width: loadingWidth,
                          height: loadingHeight,
                          uri: loadingUri,
                        }
                      : null
                  }
                />
              </Pressable>
            )
          })}
        </PagerView>
      </View>
    </Overlay>
  )
}
