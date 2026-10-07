import { Text } from '@/components/Text'
import UpName from '@/components/UpName'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BilibiliWebView from '@/components/BilibiliWebView'

import bilibiliFetch from '@/api/bilibili-fetch'
import { theme } from '@/constants/theme'
import { useLiveUpsRefresh } from '@/hooks/useLiveUpsRefresh'
import { useRecoverableWebView } from '@/hooks/useRecoverableWebView'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import { mediaUA, UA } from '../../constants'
import { showToast } from '../../utils'
import { shouldAllowWebViewRequest } from '../../utils/webview-url'
import HeaderRight from './HeaderRight'
import { DESKTOP_INJECTED_JAVASCRIPT } from './desktop-inject-code'
import { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } from './inject-code'
import { getLiveRoomId, parseLiveWebViewMessage } from './live-playback-message'
import type { LivePageProps } from './live-playback.types'
import { useLiveBackgroundPlayback } from './useLiveBackgroundPlayback'

function Loading() {
  return (
    <View className="absolute h-full w-full items-center justify-center">
      <ActivityIndicator
        accessibilityLabel="直播间加载中"
        size="large"
        colorClassName={theme.secondary.accent}
      />
    </View>
  )
}

function LiveWebPage({ route }: LivePageProps) {
  const { url, title: pageTitle } = route.params
  // 只在当前直播间生效，不写入设置；进入另一个直播间时恢复手机版。
  const [desktopRoomUrl, setDesktopRoomUrl] = React.useState<string | null>(null)
  const desktopMode = desktopRoomUrl === url

  const {
    webViewRef,
    webViewKey,
    remountWebView,
    handleWebViewMessage,
    handleRenderProcessGone,
    handleContentProcessDidTerminate,
  } = useRecoverableWebView()
  // 返回时直播状态可能已变化，补查一次直播列表
  useLiveUpsRefresh()
  // const [pageTitle, setPageTitle] = React.useState(title)

  useUpdateNavigationOptions({
    headerRight: () => (
      <HeaderRight
        desktopMode={desktopMode}
        toggleDesktopMode={() => {
          setDesktopRoomUrl(desktopMode ? null : url)
          remountWebView()
        }}
        reload={() => {
          remountWebView()
        }}
      />
    ),
    headerTitle: () => (
      <Text className="text-lg font-semibold" numberOfLines={1}>
        <UpName mid={route.params.user?.mid} className="text-lg font-semibold">
          {route.params.user?.name || pageTitle}
        </UpName>
        {route.params.user ? '的直播间' : ''}
      </Text>
    ),
  })
  const insets = useSafeAreaInsets()
  const roomId = getLiveRoomId(url)
  const { handlePlaybackMessage } = useLiveBackgroundPlayback({
    roomId,
    title: route.params.user?.name || pageTitle,
    webViewRef,
  })

  /**
   * 网页是 edge-to-edge 渲染的，底部会被系统导航栏盖住。
   * 把安全区高度写进页面，让网页里的弹幕输入条与弹幕列表整体抬上去。
   */
  function syncDanmakuBottomInset() {
    try {
      webViewRef.current?.injectJavaScript(
        `document.documentElement.style.setProperty("--minibili-danmaku-bottom", "${Math.max(insets.bottom, 0)}px");true;`,
      )
    } catch {
      // 页面还没就绪时忽略，加载完成后 onLoadEnd 会再同步一次
    }
  }

  React.useEffect(() => {
    syncDanmakuBottomInset()
  }, [insets.bottom, webViewKey])

  return (
    <BilibiliWebView
      className="flex-1"
      // style={{ height }}
      source={{ uri: desktopMode && roomId ? `https://live.bilibili.com/${roomId}` : url }}
      key={webViewKey}
      // onScroll={(e) => setEnabled(e.nativeEvent.contentOffset.y === 0)}
      originWhitelist={['http://*', 'https://*', 'bilibili://*']}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      pullToRefreshEnabled
      scalesPageToFit
      setBuiltInZoomControls
      setDisplayZoomControls={false}
      contentMode={desktopMode ? 'desktop' : 'mobile'}
      applicationNameForUserAgent={'BILIBILI/8.0.0'}
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      webviewDebuggingEnabled={__DEV__}
      injectedJavaScript={desktopMode ? DESKTOP_INJECTED_JAVASCRIPT : INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={
        desktopMode ? DESKTOP_INJECTED_JAVASCRIPT : INJECTED_JAVASCRIPT_BEFORE
      }
      renderLoading={() => <Loading />}
      userAgent={desktopMode ? mediaUA : ''}
      ref={webViewRef}
      onLoadEnd={syncDanmakuBottomInset}
      onMessage={evt => {
        if (handleWebViewMessage(evt.nativeEvent.data)) {
          return
        }

        const data = parseLiveWebViewMessage(evt.nativeEvent.data)
        if (!data) {
          return
        }

        if (handlePlaybackMessage(data)) {
          return
        }

        if (data.action === 'update-live-info') {
          const { url, callback } = data.payload
          if (getLiveRoomId(url) !== roomId) {
            return
          }
          bilibiliFetch(url, {
            headers: { 'user-agent': UA },
          })
            .then(r => r.text())
            .then(html => {
              const index = html.indexOf('__NEPTUNE_IS_MY_WAIFU__=')
              const html2 = html.substring(index)
              const index2 = html2.indexOf('</script>')
              const html3 = html2.substring(0, index2)
              webViewRef.current?.injectJavaScript(`window.${callback}(${html3});`)
            })
            .catch(() => {})
        }
      }}
      onError={() => {
        showToast('加载失败')
      }}
      onShouldStartLoadWithRequest={request => {
        if (request.url.includes('.apk')) {
          return false
        }
        return shouldAllowWebViewRequest(request)
      }}
      onRenderProcessGone={handleRenderProcessGone}
      onContentProcessDidTerminate={handleContentProcessDidTerminate}
    />
  )
}

export default LiveWebPage
