import {
  type RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { CheckBox } from '@rneui/themed'
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

import { useVideoMp4Url } from '@/api/play-url'
import Image2 from '@/components/Image2'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import { useMarkVideoWatched } from '@/store/actions'
import type { NavigationProps, RootStackParamList } from '@/types'

import { useVideoInfo } from '../../api/video-info'
import { useAppStateChange } from '../../hooks/useAppState'
import { useStore } from '../../store'
import { parseDuration, parseImgUrl, showToast } from '../../utils'
import { INJECTED_JAVASCRIPT } from './inject-play'
const PlayUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'

export default React.memo(Player)

function Player(props: { currentPage: number; onPlayEnded: () => void }) {
  const { getIsWiFi, imagesList } = useStore()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { width, height } = useWindowDimensions()
  const [verticalExpand, setVerticalExpand] = React.useState(false)
  const { data } = useVideoInfo(route.params.bvid)
  const isWifi = getIsWiFi()

  const [loadPlayer, setLoadPlayer] = React.useState(isWifi)
  const [highQuality, setHighQuality] = React.useState(isWifi)

  const loadingErrorRef = React.useRef(false)
  const webviewRef = React.useRef<WebView | null>(null)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const cid = videoInfo.pages ? videoInfo.pages[props.currentPage - 1].cid : 0
  const { videoUrl } = useVideoMp4Url(videoInfo.bvid, cid, highQuality)
  const markVideoWatched = useMarkVideoWatched()

  const [isEnded, setIsEnded] = React.useState(true)
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
    if (videoInfo.rotate) {
      videoWidth = videoInfo.height
      videoHeight = videoInfo.width
    } else {
      videoWidth = videoInfo.width
      videoHeight = videoInfo.height
    }
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
          props.onPlayEnded()
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
      // if (eventData.action === 'updateUrlSettled') {
      // }
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

  const playPageUrl = React.useMemo(() => {
    if (!videoUrl || !loadPlayer) {
      return
    }
    const search = new URLSearchParams()
    Object.entries({
      bvid: videoInfo.bvid,
      cid,
      // quality: isWifi ? 64 : 32,
      portraitFullScreen: true,
      // highQuality: isWifi ? 1 : 0,
      page: props.currentPage,
      autoplay: 1, // isWifi ? 0 : 1,
      hasMuteButton: true,
    }).forEach(([k, v]) => {
      if (v !== undefined) {
        search.append(k, `${v}`)
      }
    })
    return `${PlayUrl}?${search}#${encodeURIComponent(videoUrl)}`
  }, [videoUrl, loadPlayer, cid, videoInfo.bvid, props.currentPage])

  const player = playPageUrl ? (
    <WebView
      source={{
        uri: playPageUrl,
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
          <Image2
            source={require('../../../assets/play.png')}
            className="w-16 opacity-80"
          />
          <View className="absolute bottom-2 left-2 flex-row gap-2">
            {videoInfo?.duration ? (
              <Text className="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold">
                {parseDuration(videoInfo?.duration)}
              </Text>
            ) : null}
            {isWifi ? null : (
              <Text className="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold">
                播放将消耗流量
              </Text>
            )}
          </View>

          <View className="absolute bottom-2 right-2 ">
            <CheckBox
              checked={highQuality}
              title="高清"
              textStyle={tw('text-white')}
              wrapperStyle={tw(
                'rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold',
              )}
              checkedColor={tw(colors.secondary.text).color}
              uncheckedColor={'white'}
              size={18}
              containerStyle={tw('bg-transparent p-0 m-0')}
              onPress={() => {
                setHighQuality(!highQuality)
              }}
            />
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
