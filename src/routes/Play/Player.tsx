import { type RouteProp, useRoute } from '@react-navigation/native'
import { Icon } from '@rneui/themed'
import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'

import { usePlayUrl, useVideoDownloadUrl } from '@/api/get-playurl'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import type { RootStackParamList } from '@/types'

import { useVideoInfo } from '../../api/video-info'
import { useAppState } from '../../hooks/useAppState'
import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'
import { imgUrl, parseDuration, showToast } from '../../utils'
import { INJECTED_JAVASCRIPT } from './inject-play'
import { UPDATE_URL_CODE } from './update-playurl'

export default React.memo(Player)

// const VerticalInitScale = 0.3
// const getIsWiFi = () => false

function Player(props: { currentPage: number }) {
  const { getIsWiFi } = useStore()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { width, height } = useWindowDimensions()
  // const [verticalScale, setVerticalScale] = React.useState(VerticalInitScale)
  // const [extraHeight, setExtraHeight] = React.useState(0)
  const [verticalExpand, setVerticalExpand] = React.useState(false)
  // const playStateRef = React.useRef('')
  const { data } = useVideoInfo(route.params.bvid)
  const [loadPlayer, setLoadPlayer] = React.useState(getIsWiFi())
  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  const videoInfo = {
    ...data,
    ...route.params,
  }
  const isWifi = getIsWiFi()
  const durl = usePlayUrl(
    isWifi ? videoInfo.bvid : '',
    isWifi ? videoInfo.cid : '',
  )
  // const [webviewKey, setWebViewKey] = React.useState(videoInfo.bvid)
  const videoUrl = durl ? durl[0]?.backup_url?.[0] || durl[0]?.url || '' : null
  const [playState, setPlayState] = React.useState('init')

  const downloadVideoUrl = useVideoDownloadUrl(videoInfo.bvid, videoInfo.cid)

  // const durl = usePlayUrl('BV1SZ421y7Ae', '1460675026')
  React.useEffect(() => {
    if (!getIsWiFi()) {
      return
    }
    if (videoUrl === null) {
      return
    }
    // console.log(333, videoUrl)
    if (videoUrl) {
      webviewRef.current?.injectJavaScript(`
      window.setNewVideoUrl("${videoUrl}")
      true;
      `)
    }
    // else {
    //   webviewRef.current?.injectJavaScript(`
    //     ;(function() {
    //       const video = document.querySelector('video')
    //       if (video) {
    //         video.dataset.replaced = 'true'
    //         video.muted = false;
    //         video.play();
    //       }
    //     })();
    //     true;
    //   `)
    // }
  }, [videoUrl, getIsWiFi])

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
  React.useEffect(() => {
    if (playState === 'ended' || playState === 'pause') {
      KeepAwake.activateKeepAwakeAsync('PLAY')
    } else {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
    // if (eventData.payload === 'ended') {
    //   setExtraHeight(0)
    //   setVerticalScale(VerticalInitScale)
    // } else {
    //   setExtraHeight(26)
    // }
    // if (eventData.payload === 'play' || eventData.payload === 'playing') {
    // }
  }, [playState])

  let videoWidth = 0
  let videoHeight = 0
  if (videoInfo?.width && videoInfo?.height) {
    videoWidth = videoInfo.width
    videoHeight = videoInfo.height
  }
  const isVerticalVideo = videoWidth < videoHeight
  let videoViewHeight = width * 0.6
  if (!loadPlayer) {
    videoViewHeight = width * 0.5
  } else if (videoWidth && videoHeight) {
    if (playState === 'ended') {
      videoViewHeight = isVerticalVideo
        ? (width * videoWidth) / videoHeight
        : (videoHeight / videoWidth) * width
    } else {
      if (isVerticalVideo) {
        videoViewHeight = verticalExpand ? height * 0.66 : height * 0.33
      } else {
        videoViewHeight = (videoHeight / videoWidth) * width + 26
      }
    }
  }
  const handleMessage = (evt: WebViewMessageEvent) => {
    try {
      const eventData = JSON.parse(evt.nativeEvent.data) as any
      if (eventData.action === 'playState') {
        setPlayState(eventData.payload)
        if (eventData.payload === 'ended') {
          setVerticalExpand(false)
        }
        // 'play', 'ended', 'pause', 'waiting', 'playing'
      }
      if (eventData.action === 'change-video-height') {
        if (playState !== 'ended') {
          setVerticalExpand(eventData.payload === 'down')
        }
      }
      if (eventData.action === 'downloadVideo' && downloadVideoUrl) {
        Linking.openURL(downloadVideoUrl)
      }
      if (eventData.action === 'reload') {
        // TODO:
      }
      if (eventData.action === 'showToast') {
        showToast(eventData.payload)
      }
      if (eventData.action === 'console.log') {
        // eslint-disable-next-line no-console
        __DEV__ && console.log('message', eventData.payload)
      }
    } catch (e) {}
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
        color={tw(colors.secondary.text).color}
        className="absolute top-[45%] scale-150"
      />
    </View>
  )

  const search = new URLSearchParams()
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
  // const playUrl = 'https://www.bilibili.com/blackboard/webplayer/mbplayer.html'
  Object.entries({
    bvid: route.params.bvid,
    quality: isWifi ? 64 : 32,
    portraitFullScreen: true,
    highQuality: isWifi ? 1 : 0,
    page: props.currentPage,
    autoplay: isWifi ? 0 : 1,
    hasMuteButton: true,
    // portraitFullScreen: 1,
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
      userAgent={UA}
      // key={videoInfo.bvid}
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={isWifi ? UPDATE_URL_CODE : 'true;'}
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
      style={{ height: videoViewHeight }}>
      {/* <Text>playstate: {playState}</Text> */}
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
}
