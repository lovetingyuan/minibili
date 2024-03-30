import {
  type RouteProp,
  useFocusEffect,
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
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'

import { usePlayUrl } from '@/api/play-url'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import { useMarkVideoWatched } from '@/store/actions'
import type { NavigationProps, RootStackParamList } from '@/types'

import { useVideoInfo } from '../../api/video-info'
import { useAppStateChange } from '../../hooks/useAppState'
import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'
import { parseDuration, parseImgUrl, showToast } from '../../utils'
import { INJECTED_JAVASCRIPT } from './inject-play'
import { UPDATE_URL_CODE } from './update-playurl'

export default React.memo(Player)

function Player(props: { currentPage: number; currentCid?: number }) {
  const { getIsWiFi, imagesList } = useStore()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { width, height } = useWindowDimensions()
  const [verticalExpand, setVerticalExpand] = React.useState(false)
  const { data } = useVideoInfo(route.params.bvid)
  const isWifi = getIsWiFi()

  const [loadPlayer, setLoadPlayer] = React.useState(isWifi)
  const [updateUrlReady, setUpdateUrlReady] = React.useState(false)

  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const cid = props.currentCid || videoInfo.cid
  const { videoUrl } = usePlayUrl(videoInfo.bvid, cid, isWifi)
  const markVideoWatched = useMarkVideoWatched()

  const [isEnded, setIsEnded] = React.useState(true)
  // video created, get new videourl, we are not sure which will happen first.
  React.useEffect(() => {
    if (videoUrl && updateUrlReady) {
      webviewRef.current?.injectJavaScript(`
      window.newVideoUrl = "${videoUrl}";
      ;(function() {
        const video = document.querySelector('video[src]')
        if (video) {
          video.setAttribute('src', window.newVideoUrl)
          if (window.newVideoUrl.includes('_high_quality')) {
            document.body.dataset.replaced = 'true'
          }
          setTimeout(() => {
            video.play()
          })
        }
      })();
      true;
      `)
    }
  }, [videoUrl, updateUrlReady])
  /**
   * hasimg  play -> imagepause
   *         pause -> nothing
   * noimg   imagepause -> play
   */
  React.useEffect(() => {
    webviewRef.current?.injectJavaScript(`
    ;(function() {
      const video = document.querySelector('video');
      if (video) {
        if (${imagesList.length > 0}) {
          if (!video.paused) {
            video.pause();
            video.dataset.imgPaused = 'true'
          }
        } else {
          if (video.dataset.imgPaused === 'true') {
            video.play();
            video.dataset.imgPaused = ''
          }
        }
      }
    })();
    true;
    `)
  }, [imagesList.length])

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
    if (!isWifi) {
      showToast('注意流量')
    }
  })
  const navigation = useNavigation<NavigationProps['navigation']>()

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        KeepAwake.deactivateKeepAwake('PLAY')
      }
    }, []),
  )

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
  if (loadPlayer && videoWidth && videoHeight) {
    if (isEnded) {
      videoViewHeight = width * 0.6
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
        setIsEnded(eventData.payload === 'ended')
        if (eventData.payload === 'play') {
          KeepAwake.activateKeepAwakeAsync('PLAY')
        } else if (
          eventData.payload === 'ended' ||
          eventData.payload === 'pause'
        ) {
          KeepAwake.deactivateKeepAwake('PLAY')
        }
        if (eventData.payload === 'ended') {
          setVerticalExpand(false)
        }
        // 'play', 'ended', 'pause', 'waiting', 'playing'
      }
      if (eventData.action === 'change-video-height') {
        if (!isEnded) {
          setVerticalExpand(eventData.payload === 'down')
        }
      }
      if (eventData.action === 'reload') {
        // TODO:
      }
      if (eventData.action === 'showToast') {
        showToast(eventData.payload)
      }
      if (eventData.action === 'reportPlayTime') {
        if (videoInfo.name && videoInfo.duration && eventData.payload) {
          // @ts-ignore
          markVideoWatched(videoInfo, eventData.payload)
        }
      }
      if (eventData.action === 'updateUrlSettled') {
        setUpdateUrlReady(true)
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
          source={{ uri: parseImgUrl(videoInfo.cover, 672, 420) }}
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
    // quality: isWifi ? 64 : 32,
    portraitFullScreen: true,
    // highQuality: isWifi ? 1 : 0,
    // page: isWifi ? undefined : props.currentPage,
    // autoplay: 0, // isWifi ? 0 : 1,
    hasMuteButton: true,
  }).forEach(([k, v]) => {
    if (v !== undefined) {
      search.append(k, v + '')
    }
  })
  const player = loadPlayer ? (
    <WebView
      source={{
        uri: `${playUrl}?${search}`,
      }}
      ref={webviewRef}
      className="bg-black"
      originWhitelist={['https://*', 'bilibili://*']}
      containerStyle={tw('bg-black')}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      userAgent={UA}
      // key={videoInfo.bvid}
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={UPDATE_URL_CODE}
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
  ) : (
    <Pressable
      onPress={() => {
        setLoadPlayer(true)
      }}
      className="flex-1">
      {videoInfo?.cover ? (
        <ImageBackground
          source={{ uri: parseImgUrl(videoInfo.cover, 500, 312) }}
          resizeMode="cover"
          className="flex-1 justify-center items-center">
          <Icon
            name="television-play"
            type="material-community"
            size={60}
            color={'white'}
          />
          <View className="absolute bottom-2 left-2 flex-row gap-2">
            <Text className="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold">
              {parseDuration(videoInfo?.duration)}
            </Text>
            <Text className="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold">
              播放将消耗流量
            </Text>
          </View>
        </ImageBackground>
      ) : null}
    </Pressable>
  )
  return (
    <View
      renderToHardwareTextureAndroid
      className="w-full shrink-0 bg-black"
      style={{ height: videoViewHeight }}>
      {player}
    </View>
  )
}
