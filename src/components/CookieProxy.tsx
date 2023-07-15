// import React from 'react'
// import { StyleSheet, View, Alert } from 'react-native'
// import { WebView } from 'react-native-webview'
// import store, { useStore } from '../store'
// import { TracyId, UA } from '../constants'
// import { Dialog, Icon } from '@rneui/themed'
// // import { checkDynamicsApi } from '../api/dynamic-items'
// import useIsDark from '../hooks/useIsDark'
// import commonStyles from '../styles'

// // @ts-ignore
// function __$hack() {
//   const validate = () => {
//     const style = document.createElement('style')
//     style.textContent = `
//     * {
//       visibility: hidden;
//     }
//     html, body {
//       overflow-x: hidden;
//       visibility: visible;
//     }
//     body .geetest_panel.geetest_wind, body .geetest_panel.geetest_wind * {
//       visibility: visible;
//     }
//     body .geetest_wind.geetest_panel .geetest_panel_ghost {
//       display: none;
//     }
//     body .geetest_holder.geetest_silver .geetest_head .geetest_tips {
//       font-size: 24px;
//     }
//     body .geetest_holder.geetest_silver .geetest_panel .geetest_commit .geetest_commit_tip {
//       font-size: 24px;
//     }
//     body .geetest_wind.geetest_panel .geetest_panel_box.geetest_panelshowclick {
//       transform: scale(2.8) translate(-50%, -50%);
//       position: absolute;
//       top: 50%;
//       left: 50%;
//       right: 0;
//       bottom: 0;
//       transform-origin: 0 0;
//     }
//     body .geetest_holder.geetest_silver .geetest_panel a.geetest_close {
//       display: none;
//     }
//     `
//     document.head.appendChild(style)
//     const time = Date.now()
//     let ready = false
//     setInterval(() => {
//       const captcha = document.querySelector('.geetest_wind.geetest_panel')

//       if (captcha) {
//         if (!ready) {
//           ready = true
//           // @ts-ignore
//           window.ReactNativeWebView.postMessage(
//             JSON.stringify({
//               action: 'ready',
//               payload: document.cookie,
//             }),
//           )
//         }
//       } else {
//         window.scrollTo(0, 100000)
//         if (ready || Date.now() - time > 10000) {
//           // @ts-ignore
//           window.ReactNativeWebView.postMessage(
//             JSON.stringify({
//               action: 'cookie',
//               payload: document.cookie,
//             }),
//           )
//         }
//       }
//     }, 200)
//   }
//   // document.cookie = ''
//   if (document.readyState !== 'loading') {
//     validate()
//   } else {
//     window.addEventListener('DOMContentLoaded', function () {
//       validate()
//     })
//   }
// }

// export default React.memo(() => {
//   const webviewRef = React.useRef<WebView | null>(null)
//   const { showCaptcha, loadingDynamicError } = useStore()
//   const [ready, setReady] = React.useState(false)
//   React.useEffect(() => {
//     if (loadingDynamicError && !store.showCaptcha) {
//       store.showCaptcha = true
//     }
//   }, [loadingDynamicError])
//   const dark = useIsDark()

//   const url = `https://space.bilibili.com/${TracyId}/dynamic?_sc=${showCaptcha}`
//   const webview = React.useMemo(() => {
//     return (
//       <WebView
//         style={commonStyles.flex1}
//         source={{ uri: url }}
//         key={url}
//         originWhitelist={['http://*', 'https://*']}
//         injectedJavaScriptForMainFrameOnly
//         mediaPlaybackRequiresUserAction
//         injectedJavaScript={`(${__$hack})();true;`}
//         ref={webviewRef}
//         userAgent={UA}
//         onMessage={evt => {
//           const data = JSON.parse(evt.nativeEvent.data) as {
//             action: string
//             payload: any
//           }
//           if (data.action === 'cookie') {
//             store.$cookie = data.payload
//             store.showCaptcha = false
//             setReady(false)
//             // eslint-disable-next-line no-console
//             __DEV__ && console.log('cookie: ', store.$cookie)
//           } else if (data.action === 'ready') {
//             setReady(true)
//           } else if (data.action === 'print') {
//             // eslint-disable-next-line no-console
//             console.log('print', data.payload)
//           }
//         }}
//         onShouldStartLoadWithRequest={request => {
//           if (request.url.startsWith('bilibili://')) {
//             return false
//           }
//           if (request.url.includes('.apk')) {
//             return false
//           }
//           return true
//         }}
//       />
//     )
//   }, [url])
//   if (!showCaptcha) {
//     return null
//   }
//   const hideWebView = <View style={styles.hide}>{webview}</View>
//   if (!ready) {
//     return hideWebView
//   }
//   return (
//     <Dialog isVisible={true}>
//       <View style={styles.container}>
//         <Dialog.Title
//           title={'抱歉，需要验证'}
//           titleStyle={{
//             color: dark ? 'white' : '#333',
//           }}
//         />
//         <Icon
//           name="close"
//           size={20}
//           onPress={() => {
//             Alert.alert('验证可以避免错误', '', [
//               {
//                 text: '继续验证',
//               },
//               {
//                 text: '关闭验证',
//                 onPress: () => {
//                   store.showCaptcha = false
//                 },
//               },
//             ])
//           }}
//         />
//       </View>
//       <View style={styles.webview}>{webview}</View>
//     </Dialog>
//   )
// })

// const styles = StyleSheet.create({
//   container: { flexDirection: 'row', justifyContent: 'space-between' },
//   loading: { marginVertical: 40 },
//   webview: { height: 310 },
//   hide: { width: 0, height: 0 },
// })
