import './sentry'

import * as SentryExpo from '@sentry/react-native'
import { registerRootComponent } from 'expo'
import * as SplashScreen from 'expo-splash-screen'

import App from './App'
import { showFatalError, showToast } from './utils'

SplashScreen.preventAutoHideAsync()

if (typeof ErrorUtils === 'object') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    SentryExpo.captureException(error)
    if (!isFatal) {
      showToast('抱歉，发生了未知错误 😅')
      return
    }
    showFatalError(error)
  })
}

registerRootComponent(__DEV__ ? App : SentryExpo.wrap(App))
