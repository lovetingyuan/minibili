import { useBackHandler } from '@react-native-community/hooks'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@rn-vui/themed'
import { ResizeMode, Video } from 'expo-av'
import React from 'react'
import { Image, View } from 'react-native'
import { WebView } from 'react-native-webview'

import useLiveUrl from '@/api/get-live-url'
import useMounted from '@/hooks/useMounted'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import { UA } from '../../constants'
import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'
import HeaderRight from './HeaderRight'
import { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } from './inject-code'

function Loading() {
  return (
    <View className="absolute h-full w-full items-center justify-center">
      <Image
        source={require('../../../assets/video-loading.png')}
        resizeMode="center"
        className="w-full"
      />
    </View>
  )
}

type Props = NativeStackScreenProps<RootStackParamList, 'Living'>

export default React.memo(LiveWebPage)

function LiveWebPage({ route }: Props) {
  const { url, title: pageTitle } = route.params

  const webviewRef = React.useRef<WebView | null>(null)
  const { webViewMode, setCheckLiveTimeStamp } = useStore()
  // const [pageTitle, setPageTitle] = React.useState(title)

  useMounted(() => {
    return () => {
      setCheckLiveTimeStamp(Date.now())
    }
  })
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        // headerRight: () => (
        //   <View
        //     style={{
        //       borderWidth: 1,
        //       borderColor: 'red',
        //       width: 100,
        //       height: 20,
        //     }}>
        //     <Text>dsfdsf</Text>
        //   </View>
        //   // <HeaderRight
        //   //   reload={() => {
        //   //     webviewRef.current?.reload()
        //   //   }}
        //   // />
        // ),
        headerTitle: pageTitle,
      }
    }, [pageTitle]),
  )
  const [enableBackgroundPlay, setEnableBackgroundPlay] = React.useState(false)
  const roomId = url.startsWith('https://live.bilibili.com/h5/')
    ? url.split('/')[4]
    : ''
  const liveUrls = useLiveUrl(enableBackgroundPlay ? roomId : '')
  const videoRef = React.useRef<Video>(null)
  const [validIndex, setValidIndex] = React.useState(1)
  const backPlay = enableBackgroundPlay && roomId && liveUrls?.length
  useBackHandler(() => {
    if (backPlay) {
      // handle it
      setEnableBackgroundPlay(false)
      return true
    }
    // let the default thing happen
    return false
  })

  if (backPlay) {
    const liveUrl = liveUrls[validIndex]
    return (
      <View className="relative flex flex-1">
        <Video
          ref={videoRef}
          className="h-full min-h-96 w-full"
          key={liveUrl}
          source={{
            uri: liveUrl,
            headers: {
              'user-agent': UA,
              origin: 'https://live.bilibili.com',
              referer: 'https://live.bilibili.com',
            },
          }}
          onError={(err) => {
            showToast('抱歉出错了' + err)
            if (validIndex < liveUrls.length - 1) {
              setValidIndex(validIndex + 1)
            }
          }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />
        <View className="absolute left-2 top-2 flex-row items-center gap-4">
          {/* <Button
            title={' 返回 '}
            size="sm"
            onPress={() => {
              setEnableBackgroundPlay(false)
            }}
          /> */}
          <Text>当前支持后台播放</Text>
        </View>
      </View>
    )
  }
  return (
    <WebView
      className="flex-1"
      // style={{ height }}
      source={{ uri: url }}
      key={webViewMode + '-webview'}
      // onScroll={(e) => setEnabled(e.nativeEvent.contentOffset.y === 0)}
      originWhitelist={['http://*', 'https://*', 'bilibili://*']}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      pullToRefreshEnabled
      applicationNameForUserAgent={'BILIBILI/8.0.0'}
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      webviewDebuggingEnabled={__DEV__}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE}
      renderLoading={() => <Loading />}
      userAgent={webViewMode === 'MOBILE' ? '' : UA}
      ref={webviewRef}
      onMessage={(evt) => {
        const data = JSON.parse(evt.nativeEvent.data) as any
        if (data.action === 'enable-background-play') {
          setEnableBackgroundPlay(true)
        }

        if (data.action === 'update-live-info') {
          const { url, callback } = JSON.parse(data.payload) as {
            url: string
            callback: string
          }
          fetch(url, {
            headers: { 'user-agent': UA },
          })
            .then((r) => r.text())
            .then((html) => {
              const index = html.indexOf('__NEPTUNE_IS_MY_WAIFU__=')
              const html2 = html.substring(index)
              const index2 = html2.indexOf('</script>')
              const html3 = html2.substring(0, index2)
              webviewRef.current?.injectJavaScript(
                `window.${callback}(${html3});`,
              )
            })
        }
      }}
      onError={() => {
        showToast('加载失败')
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url.startsWith('bilibili://')) {
          // Linking.openURL(request.url).catch(err => {
          //   __DEV__ && console.error(err)
          // })
          return false
        }
        if (request.url.includes('.apk')) {
          return false
        }
        return true
      }}
    />
  )
}
