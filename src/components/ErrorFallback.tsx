import React from 'react'
import { showFatalError } from '../utils'
import { Button, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { site } from '../constants'
import useIsDark from '../hooks/useIsDark'
import * as Updates from 'expo-updates'
import useMounted from '../hooks/useMounted'
import { useTheme } from '@rneui/themed'

export default function ErrorFallback(props: { message?: string }) {
  useMounted(() => {
    showFatalError()
  })
  const { theme } = useTheme()
  if (__DEV__ && props.message) {
    // eslint-disable-next-line no-console
    console.error(props.message)
  }
  const dark = useIsDark()
  return (
    <View
      style={[
        dark ? { backgroundColor: theme.colors.black } : {},
        styles.container,
      ]}>
      <StatusBar style="auto" />
      <Image
        source={require('../../assets/error.png')}
        style={{
          aspectRatio: 1,
          width: 300,
          height: undefined,
        }}
      />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        <Text style={styles.errorMsg}>{props.message || 'N/A'}</Text>
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以
        <Text
          style={[styles.restartText, { color: theme.colors.primary }]}
          onPress={() => {
            Updates.reloadAsync()
          }}>
          {' 重启应用 '}
        </Text>
        ，我们推荐您安装新版
      </Text>
      <View style={styles.downloadBtn}>
        <Button
          title="下载最新版本"
          onPress={() => {
            Linking.openURL(site)
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: {
    marginHorizontal: 30,
    fontSize: 16,
  },
  errorMsg: { fontStyle: 'italic', fontSize: 13 },
  restartText: { fontWeight: 'bold' },
  downloadBtn: { marginVertical: 30, paddingHorizontal: 30 },
})
