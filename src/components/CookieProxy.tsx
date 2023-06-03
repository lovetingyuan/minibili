import React from 'react'
import { StyleSheet, View } from 'react-native'
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
  // document.cookie = ''
  if (document.readyState !== 'loading') {
    sendCookie()
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      sendCookie()
    })
  }
}

const showIframe = __DEV__ ? false : false

const styles = StyleSheet.create({
  container: showIframe
    ? { flex: 1 }
    : { height: 0, width: 0, overflow: 'hidden' },
})

export default () => {
  const webviewRef = React.useRef<WebView | null>(null)
  const { $userInfo, cookie } = useStore()
  // if (!$userInfo?.mid) {
  //   return null
  // }
  if (cookie && !showIframe) {
    return null
  }
  const url = `https://space.bilibili.com/${$userInfo?.mid || TracyId}/dynamic`
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        key={url}
        originWhitelist={['http://*', 'https://*', 'bilibili://*']}
        injectedJavaScriptForMainFrameOnly
        injectedJavaScript={`(${__$hack})(${__DEV__});true;`}
        ref={webviewRef}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.1774.57 Safari/537.36 Edg/113.0.1774.57"
        onMessage={evt => {
          const data = JSON.parse(evt.nativeEvent.data) as {
            action: string
            payload: any
          }
          if (data.action === 'cookie') {
            store.cookie =
              data.payload + '; DedeUserID=' + ($userInfo?.mid || TracyId)

            __DEV__ && console.log('cookie: ', store.cookie)
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
    </View>
  )
}
