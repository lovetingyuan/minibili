import { useNetInfo } from '@react-native-community/netinfo'
import { Overlay } from '@rneui/themed'
import React from 'react'
import { Linking, useWindowDimensions } from 'react-native'

// import WebView from 'react-native-webview'
import { useStore } from '../store'
import ImageViewer from './ImagesViewer'

export default React.memo(ImagesView)

function ImagesView() {
  const {
    imagesList,
    currentImageIndex,
    setOverlayButtons,
    setImagesList,
    setCurrentImageIndex,
  } = useStore()

  const netinfo = useNetInfo()
  const { width } = useWindowDimensions()
  const isWiFi = netinfo.type === 'wifi'
  const images = imagesList.map((v) => {
    let url = v.src
    if (!isWiFi) {
      url += `@${width * 0.8}w_${(width * 0.8 * v.height) / v.width}h_1c.webp`
    }
    return {
      url,
      width: v.width,
      height: v.height,
    }
  })
  return (
    <Overlay
      isVisible={imagesList.length > 0}
      fullScreen
      overlayStyle={tw('p-0 m-0')}
      onBackdropPress={() => {
        setImagesList([])
        setCurrentImageIndex(0)
      }}>
      <ImageViewer
        imageUrls={images}
        index={currentImageIndex}
        // onSave={url => {
        //   Linking.openURL(url)
        // }}
        onLongPress={(img) => {
          if (!img) {
            return
          }
          setOverlayButtons([
            {
              text: '浏览器打开',
              onPress: () => {
                Linking.openURL(img.url)
              },
            },
          ])
        }}
        menuContext={null}
      />
    </Overlay>
  )
}
