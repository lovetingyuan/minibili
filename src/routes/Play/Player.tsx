import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import {
  useWindowDimensions,
  View,
  ImageBackground,
  Pressable,
  Text,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { useVideoInfo } from '../../api/video-info'
import { INJECTED_JAVASCRIPT } from './inject-play'
import { imgUrl, parseDuration, showToast } from '../../utils'
import { Icon } from '@rneui/themed'
import { useStore } from '../../store'
import { useAppState } from '../../hooks/useAppState'
import useMounted from '../../hooks/useMounted'

export default React.memo(function Player(props: {
  bvid: string
  page: number
}) {
  const { getIsWiFi } = useStore()
  const { width, height } = useWindowDimensions()
  const [verticalScale, setVerticalScale] = React.useState(0)
  const [extraHeight, setExtraHeight] = React.useState(0)
  const playStateRef = React.useRef('')
  const { data: videoInfo, error } = useVideoInfo(props.bvid)
  const [loadPlayer, setLoadPlayer] = React.useState(getIsWiFi())
  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  useAppState(currentAppState => {
    if (
      currentAppState === 'active' &&
      loadingErrorRef.current &&
      webviewRef.current
    ) {
      webviewRef.current.reload()
    }
    if (currentAppState !== 'active') {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  })
  useMounted(() => {
    if (!getIsWiFi()) {
      showToast('注意流量')
    }
    return () => {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  })

  let videoWidth = 0
  let videoHeight = 0
  if (!error && videoInfo?.bvid && videoInfo?.width && videoInfo?.height) {
    videoWidth = videoInfo.width
    videoHeight = videoInfo.height
  }
  const isVerticalVideo = videoWidth < videoHeight

  const handleMessage = (evt: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(evt.nativeEvent.data) as any
      if (data.action === 'playState') {
        playStateRef.current = data.action
        if (data.payload === 'play') {
          KeepAwake.activateKeepAwakeAsync('PLAY')
          setExtraHeight(40)
          if (isVerticalVideo && !verticalScale) {
            setVerticalScale(0.4)
          }
        } else {
          KeepAwake.deactivateKeepAwake('PLAY')
          if (data.payload === 'ended') {
            setExtraHeight(0)
            setVerticalScale(0)
          }
        }
      }
      if (data.action === 'change-video-height') {
        setVerticalScale(data.payload === 'up' ? 0.4 : 0.7)
      }
      if (data.action === 'downloadVideo') {
        Linking.openURL(data.payload)
      }
      if (data.action === 'console.log') {
        // eslint-disable-next-line no-console
        __DEV__ && console.log('message', data.payload)
      }
    } catch (e) {}
  }

  let videoViewHeight = height * 0.4
  if (videoWidth && videoHeight) {
    videoViewHeight =
      (isVerticalVideo ? videoWidth / videoHeight : videoHeight / videoWidth) *
        width +
      extraHeight
    if (isVerticalVideo && verticalScale) {
      videoViewHeight = verticalScale * height
    }
  }
  const renderLoading = () => (
    <View className="absolute items-center w-full h-full">
      {videoInfo?.cover ? (
        <Image
          source={{ uri: imgUrl(videoInfo.cover, 672, 420) }}
          className="flex-1 w-full"
        />
      ) : null}
      <ActivityIndicator
        size={'large'}
        color={'#ff746f'}
        className="absolute top-[45%] scale-150"
      />
    </View>
  )

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  Object.entries({
    bvid: props.bvid,
    autoplay: 0,
    highQuality: getIsWiFi() ? 1 : 0,
    quality: getIsWiFi() ? 100 : 16,
    portraitFullScreen: true,
    page: props.page,
  }).forEach(([k, v]) => {
    search.append(k, v + '')
  })
  const webview = (
    <WebView
      source={{
        uri: `${playUrl}?${search}`,
      }}
      ref={webviewRef}
      originWhitelist={['https://*', 'bilibili://*']}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      renderLoading={renderLoading}
      onMessage={handleMessage}
      onLoad={() => {
        loadingErrorRef.current = false
      }}
      onError={() => {
        showToast('当前视频加载失败/(ㄒoㄒ)/~~')
        loadingErrorRef.current = true
      }}
      onShouldStartLoadWithRequest={request => {
        // Only allow navigating within this website
        if (request.url.endsWith('/log-reporter.js')) {
          return false
        }
        if (request.url.startsWith('http') && !request.url.includes('.apk')) {
          return true
        }
        return false
      }}
    />
  )
  return (
    <View
      renderToHardwareTextureAndroid
      className="w-full shrink-0"
      style={{ height: videoViewHeight + extraHeight }}>
      {loadPlayer ? (
        webview
      ) : (
        <Pressable
          onPress={() => {
            setLoadPlayer(true)
          }}
          className="flex-1">
          {videoInfo?.cover ? (
            <ImageBackground
              source={{ uri: imgUrl(videoInfo.cover, 672, 420) }}
              resizeMode="cover"
              className="flex-1 justify-center items-center">
              <Icon
                name="television-play"
                type="material-community"
                size={60}
                color={'white'}
              />
              <Text className="absolute bottom-0 m-3 rounded bg-gray-900/60 py-[2px] px-2 left-0 text-white font-bold">
                {parseDuration(videoInfo?.duration)}
              </Text>
            </ImageBackground>
          ) : null}
        </Pressable>
      )}
    </View>
  )
})
