import './sentry'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import App from './routes/Index'
// import * as Sentry from '@sentry/react-native'

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
