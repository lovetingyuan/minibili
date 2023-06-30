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
} from 'react-native'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { useVideoInfo } from '../../api/video-info'
import { INJECTED_JAVASCRIPT } from './inject-play'
import useMounted from '../../hooks/useMounted'
import { parseDuration, showToast } from '../../utils'
import { useFocusEffect } from '@react-navigation/native'
import { Icon } from '@rneui/themed'
import VideoInfoContext from './videoContext'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import MyImage from '../../components/MyImage'
import NetInfo from '@react-native-community/netinfo'
import commonStyles from '../../styles'

const VideoPlayer = React.memo((props: { wifi: boolean }) => {
  const { wifi } = props
  const { page, video, bvid } = React.useContext(VideoInfoContext)
  const { width, height } = useWindowDimensions()
  const [verticalScale, setVerticalScale] = React.useState(0)
  const [extraHeight, setExtraHeight] = React.useState(0)
  const playStateRef = React.useRef('')
  const { data: video2, error } = useVideoInfo(bvid)
  const [loadPlayer, setLoadPlayer] = React.useState(wifi)
  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  useFocusEffect(
    useMemoizedFn(() => {
      if (loadingErrorRef.current && webviewRef.current) {
        loadingErrorRef.current = false
        webviewRef.current.reload()
      }
    }),
  )
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
      <MyImage
        source={{ uri: videoInfo.cover + '@672w_378h_1c.webp' }}
        style={commonStyles.flex1}
        widthScale={1}
      />
      <ActivityIndicator
        size={'large'}
        color={'#F85A54'}
        style={{
          position: 'absolute',
          top: '45%',
        }}
      />
    </View>
  )

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  Object.entries({
    bvid: videoInfo.bvid,
    autoplay: 0,
    highQuality: wifi ? 1 : 0,
    quality: wifi ? 100 : 16,
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
      onError={() => {
        showToast('加载失败')
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

export default function Player() {
  const [wifi, setWifi] = React.useState<boolean | null>(null)

  useMounted(() => {
    NetInfo.fetch().then(state => {
      if (state.type !== 'wifi') {
        showToast(' 请注意当前网络不是Wifi ')
        setWifi(false)
      } else {
        setWifi(true)
      }
    })
  })
  if (wifi === null) {
    return <View style={{ width: '100%', height: '40%' }} />
  }
  return <VideoPlayer wifi={wifi} />
}
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
})
