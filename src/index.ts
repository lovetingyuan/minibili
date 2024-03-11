import './sentry'

import * as SentryExpo from '@sentry/react-native'
import { registerRootComponent } from 'expo'
import Constants from 'expo-constants'
import * as SplashScreen from 'expo-splash-screen'

// import getSetWbiImg from './api/get-set-user-nav'
// import { getUserNav } from './api/get-user-nav'
import App from './App'
import { showFatalError, showToast } from './utils'
import { reportUserOpenApp, Tags } from './utils/report'

SplashScreen.preventAutoHideAsync()

// const getWbiImg = () => {
//   return getUserNav().then(res => {
//     getSetWbiImg(res.wbi_img)
//   })
// }
// getWbiImg()
// setInterval(getWbiImg, 12 * 60 * 60 * 1000)

reportUserOpenApp()

const gitHash = Constants.expoConfig?.extra?.gitHash
if (gitHash) {
  SentryExpo.setTag(Tags.git_hash, gitHash)
}
if (typeof ErrorUtils === 'object') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    SentryExpo.captureException(error)
    if (!isFatal) {
      showToast('抱歉，发生了未知错误')
      return
    }
    showFatalError(error)
  })
}

registerRootComponent(__DEV__ ? App : SentryExpo.wrap(App))
