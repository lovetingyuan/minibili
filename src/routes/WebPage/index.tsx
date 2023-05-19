import React from 'react'
import {
  StyleSheet,
  View,
  ToastAndroid,
  Linking,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { INJECTED_JAVASCRIPT } from './inject-code'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import store, { useStore } from '../../store'

import { Icon } from '@rneui/themed'

const Loading = () => {
  return (
    <View style={styles.loadingView}>
      <Image
        source={require('../../../assets/video-loading.png')}
        resizeMode="center"
        style={{
          width: '100%',
          // height: '100%',
        }}
      />
    </View>
  )
}

type Props = NativeStackScreenProps<RootStackParamList, 'WebPage'>

export default ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name)
  const { url, title } = route.params
  const webviewRef = React.useRef<WebView | null>(null)
  const { $webViewMode } = useStore()
  const [height, setHeight] = React.useState(Dimensions.get('screen').height)
  const [isEnabled, setEnabled] = React.useState(true)
  const [isRefreshing, setRefreshing] = React.useState(false)
  const onRefresh = () => {
    if (webviewRef.current) {
      setRefreshing(true)
      webviewRef.current.reload()
      setTimeout(() => {
        setRefreshing(false)
      }, 1000)
    }
  }
  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon
              onPress={() => {
                store.$webViewMode =
                  store.$webViewMode === 'MOBILE' ? 'PC' : 'MOBILE'
              }}
              name={
                store.$webViewMode === 'MOBILE' ? 'mobile-friendly' : 'computer'
              }
              color="#666"
              size={18}
            />
            {/* <Icon
              name="refresh"
              size={20}
              color="#666"
              style={{ marginLeft: 8 }}
              onPress={() => {
                webviewRef.current?.reload()
              }}
            /> */}
            <Icon
              name="open-in-browser"
              size={20}
              color="#666"
              style={{ marginLeft: 8 }}
              onPress={() => {
                Linking.openURL(url)
              }}
            />
          </View>
        )
      },
    })
  }, [navigation, $webViewMode, url])
  return (
    <ScrollView
      onLayout={e => setHeight(e.nativeEvent.layout.height)}
      refreshControl={
        <RefreshControl
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          enabled={isEnabled}
        />
      }
      style={styles.container}>
      <WebView
        style={[styles.container, { height }]}
        source={{ uri: url }}
        key={$webViewMode}
        onScroll={e =>
          setEnabled(
            typeof onRefresh === 'function' &&
              e.nativeEvent.contentOffset.y === 0,
          )
        }
        originWhitelist={['http://*', 'https://*', 'bilibili://*']}
        allowsFullscreenVideo
        injectedJavaScriptForMainFrameOnly
        allowsInlineMediaPlayback
        startInLoadingState
        pullToRefreshEnabled
        applicationNameForUserAgent={'BILIBILI/8.0.0'}
        // allowsBackForwardNavigationGestures
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        renderLoading={Loading}
        userAgent={$webViewMode === 'MOBILE' ? '' : 'BILIBILI 8.0.0'}
        ref={webviewRef}
        onMessage={evt => {
          const data = JSON.parse(evt.nativeEvent.data)
          if (data.action === 'set-title' && !title) {
            navigation.setOptions({
              headerTitle: data.payload,
            })
          }
        }}
        onError={() => {
          ToastAndroid.show('加载失败', ToastAndroid.SHORT)
          // webviewRef && webviewRef.current?.reload()
        }}
        onShouldStartLoadWithRequest={request => {
          if (request.url.startsWith('bilibili://')) {
            Linking.openURL(request.url).catch(err => {
              __DEV__ && console.error(err)
            })
            return false
          }
          if (request.url.includes('.apk')) {
            return false
          }
          return true
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingImage: {
    flex: 1,
    width: undefined,
    position: 'relative',
    top: -80,
  },
})
