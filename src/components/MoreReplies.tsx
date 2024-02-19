import { BottomSheet } from '@rneui/themed'
import React from 'react'
import { useStore } from '../store'
import WebView from 'react-native-webview'
import { showToast } from '../utils'
import { View } from 'react-native'
import useIsDark from '../hooks/useIsDark'

const injectCode = `
const style = document.createElement('style');
style.textContent = \`
body {
  padding-top: 18px;
}
body .reply-list {
  padding-bottom: 20px;
}
.reply-item .info .toolbar .right {
  display: none!important;
}
.sub-reply-input.sub-input {
  display: none!important;
}
\`
document.head.appendChild(style);
true;
`
const darkCode = `
const style = document.createElement('style');
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

export default React.memo(function MoreReplies() {
  const { moreRepliesUrl, setMoreRepliesUrl } = useStore()
  const isDark = useIsDark()
  const webviewRef = React.useRef<WebView | null>(null)

  return (
    <BottomSheet
      onBackdropPress={() => {
        setMoreRepliesUrl('')
      }}
      modalProps={{
        onRequestClose: () => {
          setMoreRepliesUrl('')
        },
      }}
      isVisible={!!moreRepliesUrl}>
      {moreRepliesUrl ? (
        <View className="flex-1 h-[68vh]">
          <WebView
            className={'flex-1 bg-white dark:bg-gray-800'}
            source={{ uri: moreRepliesUrl }}
            originWhitelist={['http://*', 'https://*', 'bilibili://*']}
            injectedJavaScriptForMainFrameOnly
            startInLoadingState={false}
            injectedJavaScript={injectCode + (isDark ? darkCode : '')}
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
})
