import React from 'react'
import { showFatalError } from '../utils'
import { Button, Linking, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import MyImage from './MyImage'
import { site } from '../constants'
import useIsDark from '../hooks/useIsDark'
import * as Updates from 'expo-updates'
import useMounted from '../hooks/useMounted'

export default function ErrorFallback(props: { message?: string }) {
  useMounted(() => {
    showFatalError()
  })
  const dark = useIsDark()
  return (
    <View style={[dark ? { backgroundColor: '#333' } : {}, styles.container]}>
      <StatusBar style="auto" />
      <MyImage source={require('../../assets/error.png')} widthScale={0.8} />
      <Text style={styles.errorText}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        <Text style={{ fontStyle: 'italic' }}>{props.message || 'N/A'}</Text>
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以
        <Text
          style={styles.restartText}
          onPress={() => {
            Updates.reloadAsync()
          }}>
          重启应用
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
    color: '#ff4834',
    marginHorizontal: 30,
    fontSize: 16,
  },
  restartText: { color: '#5d5cde', fontWeight: 'bold' },
  downloadBtn: { marginVertical: 30, paddingHorizontal: 30 },
})
