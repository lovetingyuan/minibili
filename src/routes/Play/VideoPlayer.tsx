import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import { ToastAndroid, useWindowDimensions, View } from 'react-native'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { useIsWifi } from '../../hooks/useIsWifi'
import { VideoInfo } from '../../api/video-info'
import { INJECTED_JAVASCRIPT } from './inject-play'
import { Loading } from './page-loading'

function Player(props: { video: VideoInfo | null; page: number }) {
  const isWifi = useIsWifi()
  const { width, height } = useWindowDimensions()
  const [verticalScale, setVerticalScale] = React.useState(0)
  const [extraHeight, setExtraHeight] = React.useState(0)
  const playStateRef = React.useRef('')

  if (!props.video) {
    return null
  }
  let isVerticalVideo = false
  if (props.video.width && props.video.height) {
    const [videoWidth, videoHeight] = [
      props.video.pages[props.page - 1].width,
      props.video.pages[props.page - 1].height,
    ]
    isVerticalVideo = videoWidth < videoHeight
  }
  const handleMessage = (evt: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(evt.nativeEvent.data)
      if (data.action === 'playState') {
        playStateRef.current = data.action
        if (data.payload === 'play' || data.payload === 'waiting') {
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
      if (data.action === 'console.log') {
        __DEV__ && console.log('message', data.payload)
      }
    } catch (e) {}
  }

  let videoViewHeight = height * 0.4
  if (props.video.width && props.video.height) {
    const [videoWidth, videoHeight] = [
      props.video.pages[props.page - 1].width,
      props.video.pages[props.page - 1].height,
    ]
    videoViewHeight =
      (isVerticalVideo ? videoWidth / videoHeight : videoHeight / videoWidth) *
        width +
      extraHeight
    if (isVerticalVideo && verticalScale) {
      videoViewHeight = verticalScale * height
    }
  }
  const renderLoading = () => Loading(props.video?.cover)

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  Object.entries({
    bvid: props.video.bvid,
    autoplay: 1,
    highQuality: isWifi === true ? 1 : 0,
    quality: isWifi === true ? 100 : 16,
    portraitFullScreen: true,
    page: props.page,
  }).forEach(([k, v]) => {
    search.append(k, v + '')
  })
  return (
    <View
      renderToHardwareTextureAndroid
      style={{
        width: '100%',
        height: videoViewHeight + extraHeight,
        flexShrink: 0,
      }}>
      <WebView
        source={{
          uri: `${playUrl}?${search}`,
        }}
        originWhitelist={['https://*', 'bilibili://*']}
        allowsFullscreenVideo
        injectedJavaScriptForMainFrameOnly
        allowsInlineMediaPlayback
        startInLoadingState
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        renderLoading={renderLoading}
        onMessage={handleMessage}
        onError={() => {
          ToastAndroid.show('加载失败', ToastAndroid.SHORT)
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
    </View>
  )
}

export default Player
