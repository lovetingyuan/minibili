import React, { useState } from 'react'
import WebView from 'react-native-webview'
import {
  RefreshControl,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native'

const styles = StyleSheet.create({
  view: { flex: 1, height: '100%' },
})

const RefreshWebView = () => {
  const [height, setHeight] = useState(Dimensions.get('screen').height)
  const [isEnabled, setEnabled] = useState(true)
  const [isRefreshing, setRefreshing] = React.useState(false)
  const webRef = React.useRef(null)
  const onRefresh = () => {
    if (webRef.current) {
      setRefreshing(true)
      webRef.current.reload()
      setTimeout(() => {
        setRefreshing(false)
      }, 1000)
    }
  }
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
      style={styles.view}>
      <WebView
        source={{ uri: 'https://baidu.com/' }}
        ref={webRef}
        onScroll={e =>
          setEnabled(
            typeof onRefresh === 'function' &&
              e.nativeEvent.contentOffset.y === 0,
          )
        }
        style={[styles.view, { height }]}
      />
    </ScrollView>
  )
}

export default RefreshWebView
