import React from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

const INJECTED_JAVASCRIPT = `
window.ReactNativeWebView.postMessage(document.body.textContent);
`;
export default function WebviewApi(props: {
  mid: number | string;
  onLoad: (data: any) => void;
}) {
  const webviewRef = React.useRef<WebView>(null);
  const { mid, onLoad } = props;
  // const source = {
  //   uri: 'https://api.bilibili.com/x/space/acc/info?mid=' + props.mid,
  // };
  // React.useEffect(() => {
  //   // webviewRef.current?.goForward
  //   // webviewRef.current?
  //   setSource({
  //     uri: 'https://api.bilibili.com/x/space/acc/info?mid=' + props.mid,
  //   });
  //   console.log('webview update', props.mid);
  //   webviewRef.current?.injectJavaScript(`
  //   ;(function() {
  //     const url = 'https://api.bilibili.com/x/space/acc/info?mid=${props.mid}';
  //     if (location.href !== url) {
  //       location.href = url;
  //     }
  //     if (document.body) {
  //       window.ReactNativeWebView.postMessage(document.body.textContent);
  //     } else {
  //       window.onload = () => {
  //         window.ReactNativeWebView.postMessage(document.body.textContent);
  //       }
  //     }
  //   })();
  //   `);
  // }, [props.mid]);
  // const retryRef = React.useRef(0);
  const webview = React.useMemo(() => {
    return (
      <WebView
        source={{
          uri: 'https://api.bilibili.com/x/space/acc/info?mid=' + mid,
        }}
        incognito
        originWhitelist={['https://*', 'bilibili://*']}
        injectedJavaScriptForMainFrameOnly
        cacheEnabled={false}
        // userAgent={'dhjskfhjkdhfjkdhjk'}
        applicationNameForUserAgent={Math.random() + ''}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        ref={webviewRef}
        onMessage={evt => {
          try {
            const { code, data } = JSON.parse(evt.nativeEvent.data);
            if (code === 0) {
              const payload = {
                living: !!data.live_room?.liveStatus,
                liveUrl: data.live_room?.url,
                face: data.face,
                name: data.name,
                sign: data.sign,
                mid: data.mid,
                level: data.level,
                sex: data.sex,
              };
              onLoad(payload);
            }
          } catch (e) {
            onLoad(evt.nativeEvent.data);
          }
        }}
      />
    );
  }, [mid, onLoad]);
  return <View style={styles.container}>{webview}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    // opacity: 0,
  },
});
