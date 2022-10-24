import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import React from 'react';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Alert, Vibration } from 'react-native';
import { getLiveStatus } from '../services/Bilibili';
import notify from '../services/Notify';
import store from '../valtio/store';
import { useSnapshot } from 'valtio';

const BACKGROUND_FETCH_TASK = 'background-fetch';

type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function CheckLiving() {
  const navigation = useNavigation<NavigationProps['navigation']>();
  const { specialUser } = useSnapshot(store);
  const alertedRef = React.useRef(false);
  const checkTimerRef = React.useRef<any>(0);
  const checkTask = () => {
    if (!specialUser.mid) {
      return;
    }
    getLiveStatus(specialUser.mid).then(({ living, name, roomId }) => {
      if (living) {
        if (alertedRef.current) {
          return;
        }
        alertedRef.current = true;
        Vibration.cancel();
        Vibration.vibrate(10 * 1000, true);
        notify(name + '直播啦！');
        Alert.alert(name + '直播啦！', '', [
          {
            text: 'ok',
            onPress: stopCheck,
          },
          {
            text: '去直播间',
            onPress: () => {
              stopCheck();
              navigation.navigate('WebPage', {
                title: name + '的直播间',
                url: 'https://live.bilibili.com/' + roomId,
              });
            },
          },
        ]);
      }
    });
  };
  const stopCheck = () => {
    clearInterval(checkTimerRef.current);
  };
  React.useEffect(() => {
    checkTimerRef.current = setInterval(checkTask, 5 * 60 * 1000);
    // 1. Define the task by providing a name and the function that should be executed
    // Note: This needs to be called in the global scope (e.g outside of your React components)
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, () => {
      checkTask();
      // Be sure to return the successful result type!
      return BackgroundFetch.BackgroundFetchResult.NewData;
    });

    BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 5, // 3 minutes
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    });

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
    }, 1000);
    return stopCheck;
  }, []);
  return null;
}
