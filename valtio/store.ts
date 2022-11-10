import AsyncStorage from '@react-native-async-storage/async-storage';
import { proxy } from 'valtio';
import { watch } from 'valtio/utils';
import { UserInfo } from '../types';

const syncStoreKeys = [
  'blackUps',
  'followedUps',
  'blackTags',
  'userInfo',
  'specialUser',
  'webViewMode',
  'watchedVideos',
  'hideWatched',
] as const;

const store = proxy<{
  blackUps: Record<string, string>;
  followedUps: UserInfo[];
  blackTags: Record<string, boolean>;
  userInfo: UserInfo;
  specialUser: UserInfo;
  webViewMode: 'PC' | 'MOBILE';
  watchedVideos: Record<string, any>;
  dynamicUser: any;
  updatedUps: Record<string, boolean>;
  livingUps: Record<string, boolean>;
  showBlackDialog: number;
  hideWatched: boolean;
}>({
  blackUps: {},
  followedUps: [],
  blackTags: {},
  userInfo: {
    name: '',
    mid: '',
    face: '',
    sign: '',
  },
  specialUser: { name: '', mid: '', face: '', sign: '' },
  webViewMode: 'PC',
  watchedVideos: {},
  // ----
  dynamicUser: {},
  updatedUps: {},
  livingUps: {},
  showBlackDialog: 0,
  hideWatched: false,
});

Promise.all(
  syncStoreKeys.map(k => {
    return AsyncStorage.getItem(k).then(data => [k, data]);
  }),
)
  .then(res => {
    for (let i = 0; i < res.length; i++) {
      const [k, data] = res[i];
      if (data) {
        store[k] = JSON.parse(data);
      }
    }
    store.dynamicUser = store.specialUser.mid
      ? { ...store.specialUser }
      : { ...store.userInfo };
  })
  .then(() => {
    watch(get => {
      for (let k of syncStoreKeys) {
        const data = get(store)[k as keyof typeof store];
        AsyncStorage.setItem(k, JSON.stringify(data));
      }
    });
  });

export default store;
