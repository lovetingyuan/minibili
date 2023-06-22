import React from 'react'
import { Linking, StyleSheet } from 'react-native'
import { Overlay } from '@rneui/themed'
import { useNetInfo } from '@react-native-community/netinfo'
import store, { useStore } from '../store'
import WebView from 'react-native-webview'

const html = inlineRequire('./images-viewer.html')

export default React.memo(function ImagesView() {
  const { imagesList, currentImageIndex } = useStore()
  const netinfo = useNetInfo()
  const webviewRef = React.useRef<WebView | null>(null)
  if (!imagesList.length) {
    return null
  }
  return (
    <Overlay
      isVisible={true}
      fullScreen
      overlayStyle={styles.overlay}
      onBackdropPress={() => {
        store.imagesList = []
        store.currentImageIndex = 0
      }}>
      <WebView
        originWhitelist={['*']}
        ref={webviewRef}
        source={{ html }}
        onLoad={() => {
          webviewRef.current?.injectJavaScript(`
          window.images = ${JSON.stringify(imagesList)};
          window.currentImgIndex = ${currentImageIndex};
          window.isWifi = ${netinfo.type === 'wifi'};
          window.setImages && window.setImages();
          true;
        `)
        }}
        onMessage={evt => {
          const data = JSON.parse(evt.nativeEvent.data) as any
          if (data.action === 'current-index') {
            Linking.openURL(imagesList[data.payload].src)
          }
          if (data.action === 'close') {
            store.imagesList = []
            store.currentImageIndex = 0
          }
        }}
      />
    </Overlay>
  )
})

const styles = StyleSheet.create({
  pagerImage: {
    width: '100%',
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
})
