import React from 'react'
import { showFatalError } from '../utils'
import {
  BackHandler,
  Button,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import MyImage from './MyImage'
import { site } from '../constants'
import useIsDark from '../hooks/useIsDark'

class ExitError extends Error {
  constructor(m: string) {
    super(m)
    this.name = 'IgnoreThisError'
  }
}

export default function ErrorFallback(props: { message?: string }) {
  // const [, seta] = React.useState(null)
  React.useEffect(() => {
    showFatalError()
    const handleBack = () => {
      throw new ExitError('😢')
      // BackHandler.exitApp()
      // return true
    }
    BackHandler.addEventListener('hardwareBackPress', handleBack)
  }, [])
  const dark = useIsDark()
  return (
    <View style={[dark ? { backgroundColor: '#333' } : {}, { flex: 1 }]}>
      <StatusBar style="auto" />
      <MyImage source={require('../../assets/error.png')} widthScale={0.8} />
      <Text style={styles.errorText}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        {props.message || 'N/A'}
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以退出应用并重新打开，我们推荐您安装新版
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
  errorText: {
    color: '#ff4834',
    marginHorizontal: 30,
    fontSize: 16,
  },
  downloadBtn: { marginVertical: 30, paddingHorizontal: 30 },
})
