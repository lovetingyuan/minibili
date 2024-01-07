import useMounted from '../hooks/useMounted'
import { getRemoteConfig } from '../api/get-config'
import { Alert, Linking } from 'react-native'
import { delay } from '../utils'

export default function ShowRemoteConfig() {
  useMounted(() => {
    delay(10 * 1000)
      .then(() => {
        return getRemoteConfig()
      })
      .then(config => {
        if (!config.statement.show) {
          return
        }
        Alert.alert(
          config.statement.title,
          config.statement.content,
          [
            {
              text: config.statement.url ? '详情' : '确定',
              onPress: () => {
                if (config.statement.url) {
                  Linking.openURL(config.statement.url)
                }
              },
            },
          ],
          {
            cancelable: config.statement.dismiss,
          },
        )
      })
  })
  return null
}
