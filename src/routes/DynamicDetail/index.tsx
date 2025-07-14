import { useRefresh } from '@react-native-community/hooks'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
// import { Text } from '@rn-vui/themed'
// import { ResizeMode, Video } from 'expo-av'
import React, { useCallback } from 'react'
import {
  BackHandler,
  Dimensions,
  Image,
  Linking,
  Platform,
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
import { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } from './inject-code'
import { useFocusEffect } from '@react-navigation/native'

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

type Props = NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>

export default React.memo(DynamicDetailPage)

function DynamicDetailPage({ route }: Props) {
  const { title, url } = route.params

  const webviewRef = React.useRef<WebView | null>(null)
  const { webViewMode } = useStore()
  const isDark = useIsDark()
  const [height, setHeight] = React.useState(Dimensions.get('screen').height)
  const [isEnabled, setEnabled] = React.useState(true)
  // const [pageTitle, setPageTitle] = React.useState(`${name}的动态`)
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
        headerTitle: title,
      }
    }, [onRefresh, title]),
  )

  const currentNavigationStateRef = React.useRef<{
    canGoBack: boolean
    title: string
    url: string
    init?: boolean
  }>({
    canGoBack: false,
    title: '',
    url: '',
    init: true,
  })
  useFocusEffect(
    useCallback(() => {
      const onAndroidBackPress = () => {
        if (currentNavigationStateRef.current.canGoBack && webviewRef.current) {
          webviewRef.current.goBack()
          return true
        }
        return false
      }
      if (Platform.OS === 'android') {
        const handler = BackHandler.addEventListener(
          'hardwareBackPress',
          onAndroidBackPress,
        )

        return () => {
          handler.remove()
        }
      }
    }, []),
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
      injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE}
      renderLoading={() => <Loading />}
      userAgent={webViewMode === 'MOBILE' ? '' : UA}
      ref={webviewRef}
      onNavigationStateChange={(navState) => {
        currentNavigationStateRef.current = {
          canGoBack: navState.canGoBack,
          title: navState.title,
          url: navState.url,
        }
      }}
      onContentProcessDidTerminate={() => {
        webviewRef.current?.reload()
      }}
      onMessage={(evt) => {
        const data = JSON.parse(evt.nativeEvent.data) as any
        if (data.action === 'open-image') {
          const { url } = data.payload
          Linking.openURL(url)
        }
      }}
      onLoad={() => {}}
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
