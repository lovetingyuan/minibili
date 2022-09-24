import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Vibration } from 'react-native';
import { getLiveStatus } from './Bilibili';
import notify from './Notify';

const BACKGROUND_FETCH_TASK = 'background-fetch';

let timer: any = null;

export default function checkLiving() {
  if (timer) {
    return timer;
  }
  const task = () => {
    AsyncStorage.getItem('SPECIAL_USER').then(res => {
      if (res) {
        const user = JSON.parse(res);
        return getLiveStatus(user.mid).then(({ living, name }) => {
          if (!living) {
            Vibration.cancel();
            Vibration.vibrate(10 * 1000, true);
            notify(name + '直播啦！');
          }
        });
      }
    });
  };
  // 1. Define the task by providing a name and the function that should be executed
  // Note: This needs to be called in the global scope (e.g outside of your React components)
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, () => {
    task();
    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData;
  });

  BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 1, // 3 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
  timer = setInterval(task, 5 * 60 * 1000);

  setTimeout(() => {
    BackgroundFetch.getStatusAsync()
      .then(status => {
        if (status !== 3) {
          return Promise.reject(status);
        }
      })
      .catch(err => {
        notify('后台服务未启动' + err);
      });
  }, 2000);
}
