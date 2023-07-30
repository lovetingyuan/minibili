import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import {
  useWindowDimensions,
  View,
  StyleSheet,
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
import { parseDuration, showToast } from '../../utils'
import { Icon } from '@rneui/themed'
import VideoInfoContext from './videoContext'
import commonStyles from '../../styles'
import { useStore } from '../../store'
import { useAppState } from '../../hooks/useAppState'

export default React.memo(function Player() {
  const { isWiFi } = useStore()
  const { page, video, bvid } = React.useContext(VideoInfoContext)
  const { width, height } = useWindowDimensions()
  const [verticalScale, setVerticalScale] = React.useState(0)
  const [extraHeight, setExtraHeight] = React.useState(0)
  const playStateRef = React.useRef('')
  const { data: video2, error } = useVideoInfo(bvid)
  const [loadPlayer, setLoadPlayer] = React.useState(isWiFi)
  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  const currentAppState = useAppState()
  React.useEffect(() => {
    if (
      currentAppState === 'active' &&
      loadingErrorRef.current &&
      webviewRef.current
    ) {
      webviewRef.current.reload()
    }
  }, [currentAppState])
  React.useEffect(() => {
    if (!isWiFi) {
      showToast('请注意当前网络不是Wifi')
    }
  }, [isWiFi])
  const videoInfo = {
    ...video,
    ...video2,
  }
  let videoWidth = 0
  let videoHeight = 0
  if (!error && videoInfo?.bvid && videoInfo.width && videoInfo.height) {
    videoWidth = videoInfo.width
    videoHeight = videoInfo.height
  }
  const isVerticalVideo = videoWidth < videoHeight

  const handleMessage = (evt: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(evt.nativeEvent.data) as any
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
    <View style={styles.loadingView}>
      <Image
        source={{ uri: videoInfo.cover + '@672w_378h_1c.webp' }}
        style={styles.loadingImage}
      />
      <ActivityIndicator
        size={'large'}
        color={'#ff746f'}
        style={styles.videoLoading}
      />
    </View>
  )

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  Object.entries({
    bvid: videoInfo.bvid,
    autoplay: 0,
    highQuality: isWiFi ? 1 : 0,
    quality: isWiFi ? 100 : 16,
    portraitFullScreen: true,
    page,
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
      style={{
        width: '100%',
        height: videoViewHeight + extraHeight,
        flexShrink: 0,
      }}>
      {loadPlayer ? (
        webview
      ) : (
        <Pressable
          onPress={() => {
            setLoadPlayer(true)
          }}
          style={commonStyles.flex1}>
          <ImageBackground
            source={{ uri: videoInfo.cover + '@672w_378h_1c.webp' }}
            resizeMode="cover"
            style={styles.videoCover}>
            <Icon
              name="television-play"
              type="material-community"
              size={60}
              color={'white'}
            />
            <Text style={styles.duration}>
              {parseDuration(videoInfo?.duration)}
            </Text>
          </ImageBackground>
        </Pressable>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
  loadingImage: {
    flex: 1,
    width: '100%',
    height: undefined,
  },
  videoCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 0,
    margin: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    color: 'white',
    fontWeight: 'bold',
    left: 0,
    borderRadius: 4,
  },
  videoLoading: {
    position: 'absolute',
    top: '45%',
    transform: [{ scale: 1.5 }],
  },
})
