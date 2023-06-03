import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import store, { useStore } from '../store'
import { TracyId } from '../constants'
import { Dialog } from '@rneui/themed'

function __$hack() {
  // setInterval(() => {})
  const validate = () => {
    // document.body.style.display = 'none'
    const style = document.createElement('style')
    style.textContent = `
    body {
      overflow: hidden;
    }
    #biliMainHeader, #app {
      display: none!important;
    }
    body .geetest_wind.geetest_panel .geetest_panel_ghost {
      display: none;
    }
    body .geetest_holder.geetest_silver .geetest_head .geetest_tips {
      font-size: 24px;
    }
    body .geetest_holder.geetest_silver .geetest_panel .geetest_commit .geetest_commit_tip {
      font-size: 24px;
    }
    body .geetest_wind.geetest_panel .geetest_panel_box.geetest_panelshowclick {
      transform: scale(2.8) translate(-50%, -50%);
      position: absolute;
      top: 50%;
      left: 50%;
      right: 0;
      bottom: 0;
      transform-origin: 0 0;
    }
    `
    document.head.appendChild(style)
    let ready = false
    setInterval(() => {
      if (document.querySelector('.geetest_wind.geetest_panel') && !ready) {
        // @ts-ignore
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'ready',
            // payload: document.cookie,
          }),
        )
        ready = true
      }
      if (document.cookie.includes('x-bili-gaia-vtoken=')) {
        // @ts-ignore
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'cookie',
            payload: document.cookie,
          }),
        )
      }
    }, 100)
  }
  // document.cookie = ''
  if (document.readyState !== 'loading') {
    validate()
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      validate()
    })
  }
}

const showIframe = __DEV__ ? true : false

const styles = StyleSheet.create({
  container: showIframe ? {} : { height: 0, width: 0, overflow: 'hidden' },
})

export default () => {
  const webviewRef = React.useRef<WebView | null>(null)
  const { $userInfo, cookie } = useStore()
  const [visible, setVisible] = React.useState(true)
  const [ready, setReady] = React.useState(false)
  // if (!$userInfo?.mid) {
  //   return null
  // }
  if (cookie && !showIframe) {
    return null
  }
  const url = `https://space.bilibili.com/${$userInfo?.mid || TracyId}/dynamic`
  const webview = (
    <WebView
      style={{ flex: 1 }}
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
          setVisible(false)
          __DEV__ && console.log('cookie: ', store.cookie)
        } else if (data.action === 'ready') {
          setReady(true)
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
  return (
    <Dialog isVisible={visible}>
      <Dialog.Title title={ready ? '抱歉，需要验证' : '请稍后...'} />
      {ready ? (
        <View style={[styles.container, { height: 300 }]}>{webview}</View>
      ) : (
        <View>
          {webview}
          <ActivityIndicator
            color="#00AEEC"
            animating
            size={'large'}
            style={{ marginVertical: 40 }}
          />
        </View>
      )}
    </Dialog>
  )
}
