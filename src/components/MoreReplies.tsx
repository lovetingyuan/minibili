import { BottomSheet } from '@rneui/themed'
import React from 'react'
import store, { useStore } from '../store'
import WebView from 'react-native-webview'
import { showToast } from '../utils'
import { useWindowDimensions, View } from 'react-native'
import useIsDark from '../hooks/useIsDark'

const darkCode = `const style = document.createElement('style');
  style.textContent = \`
     body { background-color: #222!important; color: #ccc!important; }
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
    document.body.appendChild(style);
  true;
`

export default function MoreReplies() {
  const { moreRepliesUrl } = useStore()
  const { height } = useWindowDimensions()
  const isDark = useIsDark()
  const webviewRef = React.useRef<WebView | null>(null)
  const [webviewHeight, setWebviewHeight] = React.useState(0)
  if (!moreRepliesUrl && webviewHeight) {
    setWebviewHeight(0)
  }
  return (
    <BottomSheet
      onBackdropPress={() => {
        store.moreRepliesUrl = ''
      }}
      modalProps={{
        onRequestClose: () => {
          store.moreRepliesUrl = ''
        },
      }}
      isVisible={!!moreRepliesUrl}>
      {moreRepliesUrl ? (
        <View
          style={{
            height: height * 0.7,
            flex: 1,
          }}>
          <WebView
            style={{
              flex: 1,
              backgroundColor: isDark ? '#222' : 'white',
            }}
            source={{ uri: moreRepliesUrl }}
            originWhitelist={['http://*', 'https://*', 'bilibili://*']}
            injectedJavaScriptForMainFrameOnly
            startInLoadingState={false}
            ref={webviewRef}
            applicationNameForUserAgent={'BILIBILI/8.0.0'}
            onLoadEnd={() => {
              if (isDark) {
                webviewRef.current?.injectJavaScript(darkCode)
              }
            }}
            onError={() => {
              showToast('加载更多回复失败')
            }}
            onShouldStartLoadWithRequest={request => {
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
        </View>
      ) : null}
    </BottomSheet>
  )
}
