import React from 'react'
import { ActivityIndicator, StyleSheet, View, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import store, { useStore } from '../store'
import { TracyId } from '../constants'
import { Dialog, Icon } from '@rneui/themed'
import { checkDynamicsApi } from '../api/dynamic-items'
import useIsDark from '../hooks/useIsDark'

// @ts-ignore
function __$hack(dark) {
  const validate = () => {
    const style = document.createElement('style')
    style.textContent = `
    * {
      visibility: hidden;
    }
    html, body {
      overflow-x: hidden;
      visibility: visible;
    }
    body .geetest_panel.geetest_wind, body .geetest_panel.geetest_wind * {
      visibility: visible;
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
    body .geetest_holder.geetest_silver .geetest_panel a.geetest_close {
      display: none;
    }
    ${
      dark
        ? `
       body .geetest_panel_box.geetest_panelshowclick div {
        background-color: #222;
        color: white;
       }
       body .geetest_holder.geetest_silver .geetest_panel .geetest_commit .geetest_commit_tip {
        background-color: transparent;
       }
      body .geetest_holder.geetest_silver .geetest_table_box .geetest_window .geetest_item .geetest_big_mark .geetest_mark_no, .geetest_holder.geetest_silver .geetest_table_box .geetest_window .geetest_item .geetest_square_mark .geetest_mark_no, .geetest_holder.geetest_silver .geetest_table_box .geetest_window .geetest_item .geetest_space_mark .geetest_mark_no {
        background-color: transparent;
      }
      `
        : ''
    }
    `
    document.head.appendChild(style)
    const time = Date.now()
    let ready = false
    setInterval(() => {
      const captcha = document.querySelector('.geetest_wind.geetest_panel')

      if (captcha) {
        if (!ready) {
          ready = true
          // @ts-ignore
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              action: 'ready',
              payload: document.cookie,
            }),
          )
        }
      } else {
        window.scrollTo(0, 100000)
        // document.cookie = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        // const hasToken = document.cookie.includes('x-bili-gaia-vtoken=')
        // if (Date.now() - time > 4000) {
        //   document.cookie = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        // }
        if (ready || Date.now() - time > 10000) {
          // window.ReactNativeWebView.postMessage(
          //   JSON.stringify({
          //     action: 'print',
          //     payload: '111' + captcha + '-' + ready,
          //   }),
          // )
          // @ts-ignore
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              action: 'cookie',
              payload: document.cookie,
            }),
          )
        }
      }
      // if (timeout || document.cookie.includes('x-bili-gaia-vtoken=')) {
      // }
    }, 2000)
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

export default () => {
  const webviewRef = React.useRef<WebView | null>(null)
  const { $userInfo, showCaptcha } = useStore()
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    checkDynamicsApi()
      .then(() => {
        store.showCaptcha = false
      })
      .catch(() => {
        store.showCaptcha = true
      })
  }, [showCaptcha])
  const dark = useIsDark()
  const url = `https://space.bilibili.com/${$userInfo?.mid || TracyId}/dynamic`
  const webview = (
    <WebView
      style={{ flex: 1 }}
      source={{ uri: url }}
      key={url + showCaptcha}
      originWhitelist={['http://*', 'https://*']}
      injectedJavaScriptForMainFrameOnly
      injectedJavaScript={`(${__$hack})(${dark});true;`}
      ref={webviewRef}
      userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.1774.57 Safari/537.36 Edg/113.0.1774.57"
      onMessage={evt => {
        const data = JSON.parse(evt.nativeEvent.data) as {
          action: string
          payload: any
        }
        // console.log(333, data.action)
        if (data.action === 'cookie') {
          store.cookie =
            data.payload + '; DedeUserID=' + (store.$userInfo?.mid || TracyId)
          store.showCaptcha = false
          __DEV__ && console.log('cookie: ', store.cookie)
        } else if (data.action === 'ready') {
          setReady(true)
        } else if (data.action === 'print') {
          console.log('print', data.payload)
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
    <Dialog isVisible={showCaptcha}>
      <View style={styles.container}>
        <Dialog.Title title={ready ? '抱歉，需要验证' : '请稍后...'} />
        <Icon
          name="close"
          size={20}
          onPress={() => {
            Alert.alert('如果不验证则应用获取数据可能会失败', '', [
              {
                text: '返回',
              },
              {
                text: '关闭验证',
                onPress: () => {
                  store.showCaptcha = false
                },
              },
            ])
          }}
        />
      </View>
      {/* <View style={{ height: 300 }}>{webview}</View> */}
      {ready ? (
        <View style={styles.webview}>{webview}</View>
      ) : (
        <View style={{}}>
          {webview}
          <ActivityIndicator
            color="#00AEEC"
            animating
            size={'large'}
            style={styles.loading}
          />
        </View>
      )}
    </Dialog>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between' },
  loading: { marginVertical: 40 },
  webview: { height: 310 },
})
