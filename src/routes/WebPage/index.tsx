import { useRefresh } from '@react-native-community/hooks'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
// import { Text } from '@rn-vui/themed'
// import { ResizeMode, Video } from 'expo-av'
import React from 'react'
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'

// import useLiveUrl from '@/api/get-live-url'
// import useMounted from '@/hooks/useMounted'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import { UA } from '../../constants'
import useIsDark from '../../hooks/useIsDark'
import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'
import HeaderRight from './HeaderRight'
import { INJECTED_JAVASCRIPT } from './inject-code'

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

type Props = NativeStackScreenProps<RootStackParamList, 'WebPage'>

export default React.memo(WebPage)

function WebPage({ route }: Props) {
  const { url, title } = route.params

  const webviewRef = React.useRef<WebView | null>(null)
  const { webViewMode } = useStore()
  const isDark = useIsDark()
  const [height, setHeight] = React.useState(Dimensions.get('screen').height)
  const [isEnabled, setEnabled] = React.useState(true)
  const [pageTitle, setPageTitle] = React.useState(title)
  const [webviewKey, setWebViewKey] = React.useState(0)
  const { isRefreshing, onRefresh } = useRefresh(
    React.useCallback(() => {
      return new Promise((r) => {
        // webviewRef.current?.reload()
        setWebViewKey((k) => k + 1)
        setTimeout(r, 1000)
      })
    }, []),
  )

  useUpdateNavigationOptions(
    React.useMemo(() => {
      const headerRight = () => {
        return <HeaderRight reload={onRefresh} />
      }
      return {
        headerRight,
        headerTitle: pageTitle,
      }
    }, [onRefresh, pageTitle]),
  )

  const webview = (
    <WebView
      className="flex-1"
      style={{ height }}
      source={{ uri: url }}
      key={webViewMode + '-' + webviewKey}
      onScroll={(e) => setEnabled(e.nativeEvent.contentOffset.y === 0)}
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
      renderLoading={() => <Loading />}
      userAgent={webViewMode === 'MOBILE' ? '' : UA}
      ref={webviewRef}
      onMessage={(evt) => {
        const data = JSON.parse(evt.nativeEvent.data) as any
        if (data.action === 'set-title' && !title) {
          setPageTitle(data.payload)
        }
      }}
      onLoad={() => {
        isDark &&
          webviewRef.current?.injectJavaScript(`
        const style = document.createElement('style');
        style.textContent = \`
        body {background-color: #222; color: #ccc; }
        .reply-item {
            border-color: black;
        }
        .reply-item .info .content {
          color: #ccc;
        }
        .reply-item .info .name .left .uname {
            color: #ddd;
        }
        \`;
        document.head.appendChild(style);
      true;
   `)
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
  return (
    <ScrollView
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      refreshControl={
        <RefreshControl
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          enabled={isEnabled}
        />
      }
      className="h-full flex-1">
      {webview}
    </ScrollView>
  )
}
