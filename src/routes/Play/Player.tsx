import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
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

import { usePlayUrl, useVideoDownloadUrl } from '@/api/play-url'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import type { NavigationProps, RootStackParamList } from '@/types'

import { useVideoInfo } from '../../api/video-info'
import { useAppStateChange } from '../../hooks/useAppState'
import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'
import { imgUrl, parseDuration, showToast } from '../../utils'
import { INJECTED_JAVASCRIPT } from './inject-play'
import { UPDATE_URL_CODE } from './update-playurl'

export default React.memo(Player)

function Player(props: { currentPage: number; currentCid?: number }) {
  const { getIsWiFi, set$watchedVideos, get$watchedVideos } = useStore()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { width, height } = useWindowDimensions()
  const [verticalExpand, setVerticalExpand] = React.useState(false)
  const { data } = useVideoInfo(route.params.bvid)
  const [loadPlayer, setLoadPlayer] = React.useState(getIsWiFi())
  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const isWifi = getIsWiFi()
  const durl = usePlayUrl(
    isWifi ? videoInfo.bvid : '',
    isWifi ? props.currentCid || videoInfo.cid : '',
  )
  const videoUrl = durl ? durl[0]?.backup_url?.[0] || durl[0]?.url || '' : null
  const [playState, setPlayState] = React.useState('init')

  const downloadVideoUrl = useVideoDownloadUrl(
    videoInfo.bvid,
    props.currentCid || videoInfo.cid,
  )

  // const durl = usePlayUrl('BV1SZ421y7Ae', '1460675026')
  React.useEffect(() => {
    if (!getIsWiFi()) {
      return
    }
    if (videoUrl === null) {
      return
    }
    if (videoUrl) {
      webviewRef.current?.injectJavaScript(`
      window.setNewVideoUrl("${videoUrl}");
      true;
      `)
    }
  }, [videoUrl, getIsWiFi])

  useAppStateChange(currentAppState => {
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
  const navigation = useNavigation<NavigationProps['navigation']>()

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      e.preventDefault()
      webviewRef.current?.injectJavaScript(`
      window.reportPlayTime();
      true;
      `)
      setTimeout(() => {
        navigation.dispatch(e.data.action)
      })
      //
    })
    return unsubscribe
  }, [navigation])

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
        if (eventData.payload === 'ended' || eventData.payload === 'pause') {
          KeepAwake.deactivateKeepAwake('PLAY')
        } else {
          KeepAwake.activateKeepAwakeAsync('PLAY')
        }
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
      if (eventData.action === 'downloadVideo') {
        const url = downloadVideoUrl?.[0]?.url
        if (url) {
          Linking.openURL(url)
        } else {
          showToast('抱歉，暂不支持下载')
        }
      }
      if (eventData.action === 'reload') {
        // TODO:
      }
      if (eventData.action === 'showToast') {
        showToast(eventData.payload)
      }
      if (eventData.action === 'reportPlayTime') {
        if (videoInfo.duration && eventData.payload) {
          let playedMap = get$watchedVideos()
          const playedInfo = playedMap[videoInfo.bvid]
          const newProgress = eventData.payload
          if (playedInfo) {
            set$watchedVideos({
              ...playedMap,
              [videoInfo.bvid]: {
                ...playedInfo,
                watchProgress: Math.max(playedInfo.watchProgress, newProgress),
                watchTime: Date.now(),
                bvid: videoInfo.bvid,
              },
            })
          } else {
            const watchedVideos = Object.values(playedMap)
            if (watchedVideos.length > 500) {
              const values = watchedVideos
                .sort((a, b) => b.watchTime - a.watchTime)
                .slice(0, 400)
              playedMap = {}
              values.forEach(item => {
                playedMap[item.bvid] = item
              })
            } else {
              playedMap = { ...playedMap }
            }
            playedMap[videoInfo.bvid] = {
              watchProgress: newProgress,
              watchTime: Date.now(),
              bvid: videoInfo.bvid,
              name: videoInfo.name!,
              title: videoInfo.title,
              cover: videoInfo.cover!,
              date: videoInfo.date!,
              duration: videoInfo.duration,
            }
            set$watchedVideos(playedMap)
          }
        }
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
    page: isWifi ? undefined : props.currentPage,
    autoplay: isWifi ? 0 : 1,
    hasMuteButton: true,
    // portraitFullScreen: 1,
  }).forEach(([k, v]) => {
    if (v !== undefined) {
      search.append(k, v + '')
    }
  })
  const webview = (
    <WebView
      source={{
        uri: `${playUrl}?${search}`,
      }}
      ref={webviewRef}
      originWhitelist={['https://*', 'bilibili://*']}
      containerStyle={tw('bg-white')}
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
      className="w-full shrink-0 bg-black"
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
