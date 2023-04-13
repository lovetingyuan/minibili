import React from 'react'
import { StyleSheet, View, ToastAndroid } from 'react-native'
import { WebView } from 'react-native-webview'

const Loading = () => {
  return <View style={styles.loadingView} />
}

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import store from '../store'
import { useSnapshot } from 'valtio'
import { Button, Icon } from '@rneui/themed'
import { Pressable } from 'react-native'
import useMemoizedFn from '../hooks/useMemoizedFn'

type Props = NativeStackScreenProps<RootStackParamList, 'WebPage'>

export default ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name)
  const { url } = route.params
  const webviewRef = React.useRef<WebView | null>(null)
  const { $webViewMode } = useSnapshot(store)
  const headerRight = useMemoizedFn(() => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Button
          titleStyle={{ fontSize: 13 }}
          onPress={() => {
            store.$webViewMode = $webViewMode === 'MOBILE' ? 'PC' : 'MOBILE'
          }}
          size="sm"
          type="clear">
          {$webViewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
        </Button>
        <Pressable
          onPress={() => {
            webviewRef.current?.reload()
          }}>
          <Icon name="refresh" size={20} color="#666" />
        </Pressable>
      </View>
    )
  })
  React.useEffect(() => {
    navigation.setOptions({
      headerRight,
    })
  }, [navigation, headerRight])
  return (
    <WebView
      style={styles.container}
      source={{ uri: url }}
      key={$webViewMode}
      // originWhitelist={['https://*', 'bilibili://*']}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      applicationNameForUserAgent={'BILIBILI/8.0.0'}
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={''}
      renderLoading={Loading}
      userAgent={$webViewMode === 'MOBILE' ? '' : 'BILIBILI 8.0.0'}
      ref={webviewRef}
      onMessage={() => {
        // const { action, payload } = JSON.parse(evt.nativeEvent.data)
      }}
      onError={() => {
        ToastAndroid.show('加载失败', ToastAndroid.SHORT)
        // webviewRef && webviewRef.current?.reload()
      }}
      onShouldStartLoadWithRequest={request => {
        // Only allow navigating within this website
        if (request.url.startsWith('http') && !request.url.includes('.apk')) {
          return true
        }
        return false
      }}
    />
  )
}

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
})
