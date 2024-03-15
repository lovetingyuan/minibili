// import { ImageZoom } from '@likashefqet/react-native-image-zoom'
import { Image } from 'expo-image'
import React from 'react'
import {
  Linking,
  Modal,
  StyleSheet,
  // Text,
  useWindowDimensions,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'

import ImageViewer from '@/components/ImagesViewer'

const _images = [
  {
    height: 1290,
    ratio: 0.6627906976744186,
    src: 'https://i0.hdslb.com/bfs/new_dyn/e2f3aaf90aec250757855d6694d902dd25832136.jpg',
    width: 855,
  },
  {
    height: 1934,
    ratio: 0.6473629782833505,
    src: 'https://i0.hdslb.com/bfs/new_dyn/718a45af81ce073bf7f3968e9faa415925832136.jpg',
    width: 1252,
  },
]
// import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view'
import ImageZoom from 'react-native-image-pan-zoom'

import { useStore } from '@/store'

const MyPager = () => {
  const { width, height } = useWindowDimensions()
  const { setOverlayButtons } = useStore()
  const images = _images.map(v => {
    return {
      url: v.src,
      width: v.width,
      height: v.height,
    }
  })
  return (
    <Modal visible={true} transparent={true}>
      <ImageViewer
        imageUrls={images}
        onSave={url => {
          Linking.openURL(url)
        }}
        onLongPress={img => {
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
    </Modal>
  )
  return (
    // <Modal transparent={false}>
    <View style={{ flex: 1 }}>
      <PagerView style={styles.viewPager} initialPage={0}>
        {images.map(v => {
          return (
            <View
              key={v.src}
              style={{
                flex: 1,
                backgroundColor: 'pink',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {/* <ImageZoom
                uri={v.src}
                minScale={1}
                maxScale={3}
                onInteractionStart={() => console.log('Interaction started')}
                onInteractionEnd={() => console.log('Interaction ended')}
                onPinchStart={() => console.log('Pinch gesture started')}
                onPinchEnd={() => console.log('Pinch gesture ended')}
                onPanStart={() => console.log('Pan gesture started')}
                onPanEnd={() => console.log('Pan gesture ended')}
                onResetAnimationEnd={() => console.log('Reset animation ended')}
                resizeMode="cover"
              /> */}
              {/* <Image
                style={{
                  width: width,
                  height: 'auto',
                  aspectRatio: v.width / v.height,
                }}
                source={{ uri: v.src }}
              /> */}
              <ImageZoom
                cropWidth={width}
                cropHeight={height}
                imageWidth={width}
                minScale={1}
                imageHeight={(width * v.height) / v.width}>
                <Image
                  style={{
                    width: width,
                    height: 'auto',
                    aspectRatio: v.width / v.height,
                  }}
                  source={{ uri: v.src }}
                />
              </ImageZoom>
            </View>
          )
        })}
      </PagerView>
    </View>
    // </Modal>
  )
}

const styles = StyleSheet.create({
  viewPager: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MyPager
