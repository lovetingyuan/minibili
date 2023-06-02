import React from 'react'
import { WebView } from 'react-native-webview'
import store, { useStore } from '../store'
import { TracyId } from '../constants'

function __$hack() {
  const sendCookie = () => {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: 'cookie',
        payload: document.cookie,
      }),
    )
  }
  if (document.readyState !== 'loading') {
    sendCookie()
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      sendCookie()
    })
  }
}

export default () => {
  const webviewRef = React.useRef<WebView | null>(null)
  const { $userInfo } = useStore()
  // if (!$userInfo?.mid) {
  //   return null
  // }
  const url = `https://space.bilibili.com/${$userInfo?.mid || TracyId}/dynamic`
  return (
    <WebView
      style={[{ height: 0, width: 0 }]}
      source={{ uri: url }}
      key={url}
      originWhitelist={['http://*', 'https://*', 'bilibili://*']}
      injectedJavaScriptForMainFrameOnly
      injectedJavaScript={`(${__$hack})(${__DEV__});true;`}
      ref={webviewRef}
      onMessage={evt => {
        const data = JSON.parse(evt.nativeEvent.data) as {
          action: string
          payload: any
        }
        if (data.action === 'cookie') {
          store.cookie = data.payload
        }
      }}
      onShouldStartLoadWithRequest={request => {
        if (request.url.startsWith('bilibili://')) {
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
