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

export default function ErrorFallback(props: { message?: string }) {
  React.useEffect(() => {
    showFatalError()
    const handleBack = () => {
      BackHandler.exitApp()
      return true
    }
    BackHandler.addEventListener('hardwareBackPress', handleBack)
  }, [])
  return (
    <View>
      <StatusBar style="auto" />
      <MyImage source={require('../../assets/error.png')} widthScale={0.8} />
      <Text style={styles.errorText}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        {props.message || 'N/A'}
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以退出应用并重新打开{'\n'}我们推荐您{'  '}
        <Button
          title="下载最新版本"
          onPress={() => {
            Linking.openURL(site)
          }}
        />
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    marginHorizontal: 30,
    fontSize: 16,
  },
})
