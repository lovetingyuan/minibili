import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { Vibration } from 'react-native'
import notify from '../services/Notify'
import store from '../valtio/store'

const BACKGROUND_FETCH_TASK = 'background-fetch'

export default function checkLiving() {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, () => {
    const hasLiving = Object.values(store.livingUps).filter(Boolean).length > 0
    if (hasLiving) {
      notify('有直播')
      Vibration.vibrate(10 * 1000, true)
    }
    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData
  })

  BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 5, // 3 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  })

  setTimeout(() => {
    BackgroundFetch.getStatusAsync()
      .then(status => {
        if (status !== 3) {
          return Promise.reject(status)
        }
      })
      .catch(err => {
        notify('后台服务未启动' + err)
      })
  }, 1000)
}
