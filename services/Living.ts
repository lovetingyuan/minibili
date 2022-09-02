import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Vibration } from 'react-native';
import { getUserInfo } from './Bilibili';
import notify from './Notify';

const BACKGROUND_FETCH_TASK = 'background-fetch';

const task = async () => {
  const { living } = await getUserInfo();
  if (living) {
    await notify('翠翠直播啦！');
    Vibration.cancel();
    Vibration.vibrate(10 * 1000, true);
  }
};
// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  await task();
  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  minimumInterval: 1, // 3 minutes
  stopOnTerminate: false, // android only,
  startOnBoot: true, // android only
});
setInterval(task, 60 * 1000);

task();

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
