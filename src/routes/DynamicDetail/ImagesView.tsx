import React from 'react'
import { View, Image, Text, Linking, StyleSheet } from 'react-native'
import { Icon, Overlay } from '@rneui/themed'
import { useNetInfo } from '@react-native-community/netinfo'
import PagerView from 'react-native-pager-view'
import store, { useStore } from '../../store'

export default function ImagesView() {
  // const { images, imageIndex } = props
  const { imagesList, currentImageIndex } = useStore()
  const netinfo = useNetInfo()
  // const [visible, setVisible] = React.useState(false)
  if (!imagesList.length) {
    return null
  }
  return (
    <Overlay
      isVisible={true}
      fullScreen
      overlayStyle={styles.overlay}
      onBackdropPress={() => {
        // setVisible(false)
        store.imagesList = []
        store.currentImageIndex = 0
      }}>
      <PagerView
        style={styles.viewPager}
        initialPage={currentImageIndex}
        onPageSelected={e => {
          // props.setImageIndex(e.nativeEvent.position)
          store.currentImageIndex = e.nativeEvent.position
        }}>
        {imagesList.map(img => {
          return (
            <View key={img.src} style={styles.page}>
              <Image
                style={[styles.pagerImage, { aspectRatio: img.ratio }]}
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
          {currentImageIndex + 1}/{imagesList.length}
          {'    '}
        </Text>
        <Icon
          name="open-in-browser"
          size={22}
          color={'white'}
          onPress={() => {
            Linking.openURL(imagesList[currentImageIndex].src)
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
