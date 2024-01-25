import './sentry'
// import '@tingyuan/react-native-tailwindcss'
import * as SentryExpo from 'sentry-expo'
import { showFatalError, showToast } from './utils'
import Constants from 'expo-constants'
import { Tags, reportUserOpenApp } from './utils/report'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

reportUserOpenApp()
const gitHash = Constants.expoConfig?.extra?.gitHash
if (gitHash) {
  SentryExpo.Native.setTag(Tags.git_hash, gitHash)
}
if (typeof ErrorUtils === 'object') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    SentryExpo.Native.captureException(error)
    if (!isFatal) {
      showToast('抱歉，发生了未知错误')
      return
    }
    showFatalError()
  })
}
