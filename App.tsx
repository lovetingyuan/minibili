import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import App from './routes/Index'
import * as Sentry from 'sentry-expo'

Sentry.init({
  dsn: 'https://2ee085cec3774459876d706eac0fe6a5@o58488.ingest.sentry.io/4504039187742720',
  // dsn: 'https://39c1a6b78a794c479d6b716223e91f7b@o58488.ingest.sentry.io/125390',
  enableInExpoDevelopment: false,
  debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
})

AsyncStorage.getItem('FIRST_RUN').then(res => {
  if (!res) {
    Alert.alert(
      '使用说明',
      '本App为简易版B站，所有数据均为官方公开，切勿频繁刷新',
    )
  }
  AsyncStorage.setItem('FIRST_RUN', 'false')
})

export default App
