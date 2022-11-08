import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  ToastAndroid,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

function __hack() {
  const style = document.createElement('style');
  style.textContent = `
  #app .openapp-dialog,
  #bilibiliPlayer .mplayer-widescreen-callapp,
  #app .m-video2-awaken-btn,
  #app .launch-app-btn.related-openapp,
  #app .launch-app-btn.m-space-float-openapp,
  #app .mplayer-buff-app,
  #app .launch-app-btn.home-float-openapp,
  #app .m-home-no-more,
  #app .launch-app-btn.m-nav-openapp,
  #app .follow .follow-btn,
  #app .launch-app-btn.related-openapp,
  #app .launch-app-btn.dynamic-float-openapp.dynamic-float-btn {
    display: none!important;
  }

  `;
  document.head.appendChild(style);
  if (window.location.pathname.startsWith('/video/')) {
    const timer = setInterval(() => {
      const player = document.querySelector('video');
      if (player && player.readyState === 4) {
        player.play();
        clearInterval(timer);
      }
    }, 200);
    const timer2 = setInterval(() => {
      const jump = document.querySelector('.mplayer-toast-jump');
      if (jump) {
        (jump as HTMLSpanElement).click();
        clearInterval(timer2);
      }
    }, 200);
    setTimeout(() => {
      clearInterval(timer2);
    }, 3000);
    setTimeout(() => {
      const shareBtn = document
        .querySelector('.video-toolbar')
        ?.children.item(4);
      if (shareBtn && shareBtn?.textContent?.includes('分享')) {
        shareBtn.addEventListener('click', () => {
          ((window as any).ReactNativeWebView as WebView).postMessage(
            JSON.stringify({
              action: 'share',
              payload: {
                title: document.title,
                url: window.location.href,
              },
            }),
          );
        });
      }
    }, 1000);
  }
  document.addEventListener(
    'click',
    evt => {
      let el = evt.target as HTMLElement & { __vue__?: any };
      if (el.classList.contains('m-video2-float-openapp')) {
        ((window as any).ReactNativeWebView as WebView).postMessage(
          JSON.stringify({
            action: 'openapp',
            payload: window.location.pathname.split('/').pop(),
          }),
        );
        return;
      }
      while (el && el !== document.body) {
        if (el.__vue__ && evt.isTrusted) {
          if (el.dataset.aid && el.__vue__.info && el.__vue__.info.bvid) {
            window.location.href = `https://m.bilibili.com/video/${el.__vue__.info.bvid}`;
            break;
          }
          if (
            el.classList.contains('card') &&
            el.__vue__.card &&
            el.__vue__.card.desc &&
            el.__vue__.card.desc.bvid
          ) {
            window.location.href = `https://m.bilibili.com/video/${el.__vue__.card.desc.bvid}`;
            break;
          }
          if (
            el.classList.contains('launch-app-btn') &&
            (el.parentElement?.classList.contains('video-card') ||
              el.parentElement?.classList.contains('season-video-item')) &&
            el.__vue__.bvid
          ) {
            window.location.href = `https://m.bilibili.com/video/${el.__vue__.bvid}`;
            break;
          }
          if (
            el.classList.contains('launch-app-btn') &&
            el.parentElement?.classList.contains('up') &&
            el.querySelector('.face') &&
            el.__vue__ &&
            el.__vue__.id
          ) {
            window.location.href = `https://m.bilibili.com/space/${el.__vue__.id}`;
            break;
          }
        }
        el = el.parentElement!;
      }
    },
    true,
  );
}
const INJECTED_JAVASCRIPT = `(${__hack.toString()})();`;
const Loading = () => {
  return (
    <View style={styles.loadingView}>
      <Image
        style={styles.loadingImage}
        resizeMode="contain"
        source={require('../assets/video-loading.png')}
      />
    </View>
  );
};

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import store from '../valtio/store';
import { useSnapshot } from 'valtio';

type Props = NativeStackScreenProps<RootStackParamList, 'WebPage'>;

export default ({ route }: Props) => {
  __DEV__ && console.log(route.name);
  const { url } = route.params;
  const webviewRef = React.useRef<WebView | null>(null);
  const { webViewMode } = useSnapshot(store);
  return (
    <WebView
      style={styles.container}
      source={{ uri: url }}
      key={webViewMode}
      // originWhitelist={['https://*', 'bilibili://*']}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      applicationNameForUserAgent={'BILIBILI/8.0.0'}
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      renderLoading={Loading}
      userAgent={webViewMode === 'MOBILE' ? '' : 'BILIBILI 8.0.0'}
      ref={webviewRef}
      onMessage={evt => {
        const { action, payload } = JSON.parse(evt.nativeEvent.data);
        if (action === 'openapp') {
          ToastAndroid.show('正在打开app', ToastAndroid.SHORT);
          Linking.openURL(`bilibili://video/${payload}`);
        } else if (action === 'share') {
          const { title, url: _url } = payload;
          Share.share({ title, url: _url, message: [title, _url].join('\n') });
        } else if (action === 'alert') {
          Alert.alert(payload);
        }
      }}
      onError={() => {
        ToastAndroid.show('加载失败', ToastAndroid.SHORT);
        webviewRef && webviewRef.current?.reload();
      }}
      onShouldStartLoadWithRequest={request => {
        // Only allow navigating within this website
        if (request.url.startsWith('http') && !request.url.includes('.apk')) {
          return true;
        }
        return false;
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  loadingImage: {
    flex: 1,
    width: undefined,
    position: 'relative',
    top: -80,
  },
});
