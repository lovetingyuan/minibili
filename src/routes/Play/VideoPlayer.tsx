import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import {
  ToastAndroid,
  useWindowDimensions,
  View,
  Image,
  StyleSheet,
} from 'react-native'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { useVideoInfo } from '../../api/video-info'
import { useIsWifi } from '../../hooks/useIsWifi'
import { INJECTED_JAVASCRIPT } from './inject-play'

function Player(props: { cover: string; page: number; bvid: string }) {
  const { cover, page, bvid } = props
  const isWifi = useIsWifi()
  const { width, height } = useWindowDimensions()
  const [verticalScale, setVerticalScale] = React.useState(0)
  const [extraHeight, setExtraHeight] = React.useState(0)
  const playStateRef = React.useRef('')
  const { data: videoInfo, error } = useVideoInfo(bvid)

  let videoWidth = 0
  let videoHeight = 0
  if (!error && videoInfo?.bvid) {
    videoWidth = videoInfo.width
    videoHeight = videoInfo.height
  }
  const isVerticalVideo = videoWidth < videoHeight

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
    <View style={styles.loadingView}>
      <Image
        style={{
          flex: 1,
          width: cover ? '100%' : '80%',
        }}
        resizeMode="cover"
        source={
          cover ? { uri: cover } : require('../../../assets/video-loading.png')
        }
      />
    </View>
  )

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  Object.entries({
    bvid,
    autoplay: 1,
    highQuality: isWifi === true ? 1 : 0,
    quality: isWifi === true ? 100 : 16,
    portraitFullScreen: true,
    page,
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
const styles = StyleSheet.create({
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
})