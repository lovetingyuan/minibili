import * as SentryExpo from '@sentry/react-native'
import Constants from 'expo-constants'

import { Tags } from './utils/report'

if (!__DEV__) {
  SentryExpo.init({
    dsn: Constants.expoConfig?.extra?.dsn,
    release: Constants.expoConfig?.extra?.releaseName,
    // enableInExpoDevelopment: false,
    enabled: !__DEV__,
    debug: __DEV__,
    // beforeSend(event, hint) {
    //   console.log('sentry error', event, hint)
    //   return null
    // },
    // integrations: [
    //   new Sentry.ReactNativeTracing({
    //     tracePropagationTargets: ['localhost', /^\//],
    //     // ... other options
    //   }),
    // ],
  })
  const gitHash = Constants.expoConfig?.extra?.gitHash
  if (gitHash) {
    SentryExpo.setTag(Tags.git_hash, gitHash)
  }
}
