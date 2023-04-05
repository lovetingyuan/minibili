import React from 'react'
import { View, Pressable, Image, Text, Linking, StyleSheet } from 'react-native'
import { Overlay } from '@rneui/base'
import { useNetInfo } from '@react-native-community/netinfo'
import PagerView from 'react-native-pager-view'

export default function ImagesView(props: {
  images: { src: string; ratio: number }[]
  imageIndex: number
  setImageIndex: (p: number) => void
  visible: boolean
}) {
  const { images, imageIndex, visible } = props
  const netinfo = useNetInfo()

  return (
    <Overlay
      isVisible={visible}
      fullScreen
      overlayStyle={styles.overlay}
      onBackdropPress={() => {
        // setVisible(false)
      }}>
      <PagerView
        style={styles.viewPager}
        initialPage={imageIndex}
        onPageSelected={e => {
          props.setImageIndex(e.nativeEvent.position)
        }}>
        {images.map(img => {
          return (
            <View key={img.src} style={styles.page}>
              <Pressable
                onPress={() => {
                  Linking.openURL(img.src)
                }}>
                <Image
                  style={[styles.pagerImage, { aspectRatio: img.ratio }]}
                  key={img.src}
                  loadingIndicatorSource={require('../../../assets/loading.png')}
                  source={{
                    uri:
                      netinfo.type === 'wifi'
                        ? img.src
                        : img.src + '@640w_640h_2c.webp',
                  }}
                />
              </Pressable>
            </View>
          )
        })}
      </PagerView>
      <View style={styles.pagerNum}>
        <Text style={styles.pagerNumText}>
          {imageIndex + 1}/{images.length}
        </Text>
      </View>
    </Overlay>
  )
}

const styles = StyleSheet.create({
  pagerImage: {
    width: '100%',
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  viewPager: {
    flex: 1,
  },
  page: {
    // borderWidth: 1,
    // borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerNum: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pagerNumText: {
    color: 'white',
    fontSize: 16,
  },
})
