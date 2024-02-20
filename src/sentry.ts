import * as SentryExpo from '@sentry/react-native'
import Constants from 'expo-constants'

if (!__DEV__) {
}
SentryExpo.init({
  dsn: Constants.expoConfig?.extra?.dsn,
  release: Constants.expoConfig?.extra?.releaseName,
  // enableInExpoDevelopment: false,
  enabled: !__DEV__,
  debug: __DEV__,
  // integrations: [
  //   new Sentry.ReactNativeTracing({
  //     tracePropagationTargets: ['localhost', /^\//],
  //     // ... other options
  //   }),
  // ],
})
