import { Download, ScanSearch, X } from 'lucide-react-native'
import { useReducer, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, useWindowDimensions, View } from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import { GestureViewer, useGestureViewerState } from 'react-native-gesture-image-viewer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Image } from '@/components/styled/expo'
import { Text } from '@/components/styled/native'
import { ThemedIcon } from '@/components/ThemedIcon'
import { useSaveImage } from '@/hooks/useSaveImage'
import { useStore } from '@/store'
import { showToast } from '@/utils'
import { normalizeImages } from './image-viewer-images'
import { getOriginalImageButtonLabel, updateOriginalImageStatuses } from './image-viewer-state'
import type {
  ImageViewerControlsProps,
  ImageViewerGalleryProps,
  ImageViewerItem,
  ImageViewerSourceProps,
} from './image-viewer.types'

const ViewerId = 'images-viewer'
const BackdropStyle = { backgroundColor: 'rgba(0, 0, 0, 0.88)' }

function getItemDimensions(image: ImageViewerItem) {
  return image.width > 0 && image.height > 0 ? image : undefined
}

function getItemKey(image: ImageViewerItem) {
  return `${image.uri}:${image.width}:${image.height}`
}

function ImageViewerGallery({
  height,
  images,
  initialIndex,
  onClose,
  width,
}: ImageViewerGalleryProps) {
  const [originalImageStatuses, dispatchOriginalImageStatus] = useReducer(
    updateOriginalImageStatuses,
    {},
  )

  const handleOriginalLoaded = (uri: string) => {
    dispatchOriginalImageStatus({ type: 'loaded', uri })
  }

  const handleOriginalFailed = (uri: string) => {
    dispatchOriginalImageStatus({ type: 'failed', uri })
    showToast('原图加载失败，请稍后重试')
  }

  const requestOriginal = (uri: string) => {
    dispatchOriginalImageStatus({ type: 'request', uri })
  }

  return (
    <GestureViewer
      backdropStyle={BackdropStyle}
      data={images}
      dismiss={{ enabled: true, resistance: 1, threshold: 100 }}
      getItemDimensions={getItemDimensions}
      getItemKey={getItemKey}
      height={height}
      id={ViewerId}
      initialIndex={initialIndex}
      maxZoomScale={4}
      onDismiss={onClose}
      pageSpacing={12}
      panInertia
      renderContainer={(children, { dismiss }) => (
        <View className="flex-1">
          {children}
          <ImageViewerControls
            images={images}
            initialIndex={initialIndex}
            onClose={dismiss}
            onOriginalRequest={requestOriginal}
            originalImageStatuses={originalImageStatuses}
          />
        </View>
      )}
      renderItem={(image, _index, info) => (
        <ImageViewerSource
          key={getItemKey(image)}
          image={image}
          info={info}
          onOriginalFailed={handleOriginalFailed}
          onOriginalLoaded={handleOriginalLoaded}
          originalStatus={originalImageStatuses[image.originalUri] ?? 'idle'}
        />
      )}
      width={width}
      windowSize={3}
    />
  )
}

function ImageViewerSource({
  image,
  info,
  onOriginalFailed,
  onOriginalLoaded,
  originalStatus,
}: ImageViewerSourceProps) {
  const [loading, setLoading] = useState(true)
  const showOriginal = image.uri !== image.originalUri && originalStatus !== 'idle'

  return (
    <View className="h-full w-full" pointerEvents="none">
      {loading ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
      <Image
        cachePolicy="memory-disk"
        className="h-full w-full"
        contentFit="contain"
        onError={() => setLoading(false)}
        onLoad={({ source }) => {
          info.setItemDimensions(source)
          setLoading(false)
        }}
        priority={info.isActive ? 'high' : 'normal'}
        recyclingKey={image.uri}
        source={{ uri: image.uri }}
        transition={0}
      />
      {showOriginal ? (
        <Image
          cachePolicy="memory-disk"
          className="absolute inset-0"
          contentFit="contain"
          onError={() => onOriginalFailed(image.originalUri)}
          onLoad={({ source }) => {
            info.setItemDimensions(source)
            onOriginalLoaded(image.originalUri)
          }}
          priority={info.isActive ? 'high' : 'normal'}
          recyclingKey={image.originalUri}
          source={{ uri: image.originalUri }}
          transition={120}
        />
      ) : null}
    </View>
  )
}

function ImageViewerControls({
  images,
  initialIndex,
  onClose,
  onOriginalRequest,
  originalImageStatuses,
}: ImageViewerControlsProps) {
  // 页码和下载状态只更新工具栏，不让整个查看器随之重渲染。
  const { currentIndex, totalCount } = useGestureViewerState(ViewerId)
  const { saving, saveImage } = useSaveImage()
  const insets = useSafeAreaInsets()
  const activeIndex = totalCount === images.length ? currentIndex : initialIndex
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), images.length - 1)
  const activeImage = images[safeActiveIndex]
  const originalStatus = activeImage
    ? (originalImageStatuses[activeImage.originalUri] ?? 'idle')
    : 'idle'
  const isOriginal = activeImage?.uri === activeImage?.originalUri
  const originalButtonLabel = getOriginalImageButtonLabel(originalStatus, isOriginal)
  const originalButtonDisabled = !activeImage || isOriginal || originalStatus !== 'idle'
  const downloadButtonDisabled = !activeImage || saving

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <View
        className="absolute right-4"
        pointerEvents="box-none"
        style={{ top: Math.max(12, insets.top + 8) }}
      >
        <Pressable
          accessibilityLabel="关闭"
          accessibilityRole="button"
          className="size-10 items-center justify-center rounded-full bg-black/35"
          hitSlop={12}
          onPress={onClose}
        >
          <ThemedIcon color="#fff" icon={X} size={24} />
        </Pressable>
      </View>
      <View
        className="absolute inset-x-0 items-center"
        pointerEvents="box-none"
        style={{ bottom: Math.max(28, insets.bottom + 12) }}
      >
        <View className="flex-row items-center gap-5 rounded-full bg-black/35 px-4 py-2.5">
          <Pressable
            accessibilityLabel={originalButtonLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: originalButtonDisabled }}
            className={`flex-row items-center gap-2 ${originalButtonDisabled ? 'opacity-70' : ''}`}
            disabled={originalButtonDisabled}
            hitSlop={12}
            onPress={() => {
              if (!originalButtonDisabled && activeImage) {
                onOriginalRequest(activeImage.originalUri)
              }
            }}
          >
            {originalStatus === 'loading' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedIcon color="#fff" icon={ScanSearch} size={20} />
            )}
            <Text className="text-sm text-white">{originalButtonLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="下载图片"
            accessibilityRole="button"
            accessibilityState={{ disabled: downloadButtonDisabled }}
            className={`flex-row items-center gap-2 ${downloadButtonDisabled ? 'opacity-70' : ''}`}
            disabled={downloadButtonDisabled}
            hitSlop={12}
            onPress={() => {
              if (!downloadButtonDisabled && activeImage) {
                void saveImage(activeImage.originalUri)
              }
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedIcon color="#fff" icon={Download} size={20} />
            )}
            <Text className="text-sm text-white">下载</Text>
          </Pressable>
          <Text className="text-center text-base text-white tabular-nums">
            {`${safeActiveIndex + 1} / ${images.length}`}
          </Text>
        </View>
      </View>
    </View>
  )
}

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } = useStore()
  const windowDimensions = useWindowDimensions()
  const [viewport, setViewport] = useState(windowDimensions)
  const images = normalizeImages(imagesList, viewport.width, viewport.height)
  const visible = images.length > 0
  const galleryKey = `${currentImageIndex}:${images.map(image => image.originalUri).join('|')}`

  const closeViewer = () => {
    setImagesList([])
    setCurrentImageIndex(0)
  }

  const handleLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layout.width > 0 && layout.height > 0) {
      setViewport(previous =>
        previous.width === layout.width && previous.height === layout.height
          ? previous
          : { ...previous, width: layout.width, height: layout.height },
      )
    }
  }

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={closeViewer}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1" onLayout={handleLayout}>
        {visible ? (
          <ImageViewerGallery
            key={galleryKey}
            height={viewport.height}
            images={images}
            initialIndex={currentImageIndex}
            onClose={closeViewer}
            width={viewport.width}
          />
        ) : null}
      </View>
    </Modal>
  )
}

export default ImagesView
