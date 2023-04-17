import React from 'react'
import { View, Image, Text, Linking, StyleSheet } from 'react-native'
import { Icon, Overlay } from '@rneui/themed'
import { useNetInfo } from '@react-native-community/netinfo'
import PagerView from 'react-native-pager-view'

export default function ImagesView(props: {
  images: { src: string; ratio: number }[]
  imageIndex: number
  setImageIndex: (p: number) => void
  visible: boolean
  setVisible: (v: boolean) => void
}) {
  const { images, imageIndex, visible, setVisible } = props
  const netinfo = useNetInfo()

  return (
    <Overlay
      isVisible={visible}
      fullScreen
      overlayStyle={styles.overlay}
      onBackdropPress={() => {
        setVisible(false)
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
            </View>
          )
        })}
      </PagerView>
      <View style={styles.pagerNum}>
        <Text style={styles.pagerNumText}>
          {imageIndex + 1}/{images.length}
          {'    '}
        </Text>
        <Icon
          name="open-in-browser"
          size={22}
          color={'white'}
          onPress={() => {
            Linking.openURL(images[imageIndex].src)
          }}
        />
      </View>
    </Overlay>
  )
}

const styles = StyleSheet.create({
  pagerImage: {
    width: '100%',
    maxHeight: '100%',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerNum: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 8,
    borderRadius: 4,
    paddingVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,.3)',
  },
  pagerNumText: {
    color: 'white',
    fontSize: 16,
  },
})
