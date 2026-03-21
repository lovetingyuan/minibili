import { Image } from '@/components/styled/expo'
import { Icon, Text } from '@/components/styled/rneui'
import React from 'react'
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { GestureViewer, useGestureViewerState } from 'react-native-gesture-image-viewer'

import { parseImgUrl } from '@/utils'

import { useStore } from '../store'
import type { ViewerImage } from './ImagesView.type'

const ViewerId = 'images-viewer'
const LoadingPlaceholder = require('../../assets/loading2.gif')

function normalizeImages(
  imagesList: {
    src: string
    width: number
    height: number
    ratio?: number
  }[],
) {
  return imagesList.map<ViewerImage>((image) => {
    return {
      uri: parseImgUrl(image.src),
      originalUri: image.src.split('@')[0],
      width: image.width,
      height: image.height,
    }
  })
}

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } = useStore()
  const { currentIndex, totalCount } = useGestureViewerState(ViewerId)

  const images = normalizeImages(imagesList)
  const visible = images.length > 0
  const activeIndex = totalCount > 0 ? currentIndex : currentImageIndex
  const safeActiveIndex =
    images.length > 0 ? Math.min(Math.max(activeIndex, 0), images.length - 1) : 0
  const activeTotal = totalCount || images.length
  const viewerKey = `${currentImageIndex}:${images.map(image => image.uri).join('|')}`

  const closeViewer = () => {
    setImagesList([])
    setCurrentImageIndex(0)
  }

  const openOriginalImage = () => {
    const image = images[safeActiveIndex] ?? images[0]

    if (!image) {
      return
    }

    void Linking.openURL(image.originalUri)
  }

  const renderContainer = (
    children: React.ReactElement,
    _helpers: { dismiss: () => void },
  ) => {
    return (
      <View style={styles.container}>
        {children}
        <View pointerEvents="box-none" style={styles.overlay}>
          <View pointerEvents="box-none" style={styles.bottomBarWrap}>
            <View style={styles.bottomBar}>
              <Pressable hitSlop={12} onPress={openOriginalImage}>
                <Icon
                  color="#fff"
                  name="download"
                  size={20}
                  type="fontisto"
                />
              </Pressable>
              <Text style={styles.counterText}>{`${safeActiveIndex + 1} / ${activeTotal}`}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeViewer}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      {visible ? (
        <GestureViewer
          backdropStyle={styles.backdrop}
          key={viewerKey}
          data={images}
          dismiss={{ enabled: true }}
          id={ViewerId}
          initialIndex={currentImageIndex}
          ListComponent={FlatList}
          maxZoomScale={4}
          onDismiss={closeViewer}
          renderContainer={renderContainer}
          renderItem={(item) => {
            return (
              <Image
                contentFit="contain"
                placeholder={LoadingPlaceholder}
                recyclingKey={item.uri}
                source={{ uri: item.uri }}
                style={styles.image}
              />
            )
          }}
        />
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  bottomBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bottomBarWrap: {
    alignItems: 'center',
    bottom: 28,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  container: {
    flex: 1,
  },
  counterText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 5,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})

export default ImagesView
