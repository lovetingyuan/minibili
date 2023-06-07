import React from 'react'
import {
  View,
  Text,
  Linking,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { Icon, Overlay } from '@rneui/themed'
import { useNetInfo } from '@react-native-community/netinfo'
import PagerView from 'react-native-pager-view'
import store, { useStore } from '../store'
import { Image } from 'expo-image'

export default function ImagesView() {
  const { imagesList, currentImageIndex } = useStore()
  const netinfo = useNetInfo()
  const { width, height } = useWindowDimensions()
  const ratio = width / height
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
      <PagerView
        style={styles.viewPager}
        initialPage={currentImageIndex}
        onPageSelected={e => {
          store.currentImageIndex = e.nativeEvent.position
        }}>
        {imagesList.map((img, i) => {
          const url =
            netinfo.type === 'wifi' ? img.src : img.src + '@640w_640h_2c.webp'
          return (
            <ScrollView
              key={img.src + i}
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(img.ratio < ratio ? {} : { flex: 1 }),
              }}>
              <View style={[styles.page]}>
                <Image
                  style={[
                    styles.pagerImage,
                    {
                      aspectRatio: img.ratio,
                    },
                  ]}
                  placeholderContentFit="contain"
                  // placeholder={{ uri: '../../assets/loading.png' }}
                  source={{
                    uri: url,
                  }}
                />
              </View>
            </ScrollView>
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
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
