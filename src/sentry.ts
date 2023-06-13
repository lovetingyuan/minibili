import * as SentryExpo from 'sentry-expo'
import Constants from 'expo-constants'

// eslint-disable-next-line no-console
__DEV__ && console.log('sentry dsn', Constants.expoConfig?.extra?.dsn)

SentryExpo.init({
  dsn: Constants.expoConfig?.extra?.dsn,
  release: Constants.expoConfig?.extra?.releaseName,
  enableInExpoDevelopment: false,
  debug: __DEV__,
  // integrations: [
  //   new Sentry.ReactNativeTracing({
  //     tracePropagationTargets: ['localhost', /^\//],
  //     // ... other options
  //   }),
  // ],
})
