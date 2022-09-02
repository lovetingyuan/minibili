import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import notify from '../services/Notify';
import { ToastAndroid } from 'react-native';

export const checkWifi = () => {
  return NetInfo.fetch().then(state => {
    if (state.isConnected) {
      if (state.type !== 'wifi') {
        notify('注意流量消耗', '当前网络不是WIFI');
        ToastAndroid.showWithGravity(
          ' 请注意当前网络不是WIFI ',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
      }
      return state.type;
    } else {
      ToastAndroid.show('当前网络有问题', ToastAndroid.SHORT);
    }
  });
};

export default function useNetStatusToast(...deps: any[]) {
  const [type, setType] = React.useState('');
  React.useEffect(() => {
    checkWifi().then(t => {
      setType(t || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return type;
}
