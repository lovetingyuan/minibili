import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import {
  createStore,
  type AtomicStoreMethodsType,
} from "react-atomic-store";

import { RanksConfig } from "../constants";
import type { CollectVideoInfo, HistoryVideoInfo, UpInfo } from "../types";
import type { MusicSong, UpdateUpInfo } from "./types";

const StoragePrefix = "Store:";

export const getAppValue = () => {
  return {
    /**
     * 首次运行的时间
     */
    $firstRun: -1,
    /**
     * 拉黑的up主，key是下划线加上up的mid
     */
    $blackUps: {} as Record<string, string>,
    /**
     * 关注的up主
     */
    $followedUps: [] as UpInfo[],
    /**
     * 不感兴趣的分类
     */
    $blackTags: {} as Record<string, string>,
    /**
     * 有更新的up主
     */
    $upUpdateMap: {} as Record<string, UpdateUpInfo>,
    $ignoredVersions: [] as string[],
    $videoCatesList: RanksConfig,
    $collectedVideos: [] as CollectVideoInfo[],
    $watchedVideos: {} as Record<string, HistoryVideoInfo>,
    $showUsageStatement: true,
    $musicList: [
      {
        name: "默认",
        songs: [],
      },
    ] as {
      name: string;
      songs: MusicSong[];
    }[],
    $watchedHotSearch: {} as Record<string, number>,
    $checkAppUpdateTime: 0,
    // -------------------------
    initialed: false,
    isWiFi: false,
    webViewMode: "MOBILE" as "PC" | "MOBILE",
    livingUps: {} as Record<string, string>,
    currentVideosCate: RanksConfig[0] as (typeof RanksConfig)[number],
    imagesList: [] as {
      src: string;
      width: number;
      height: number;
      ratio?: number;
    }[],
    currentImageIndex: 0,
    overlayButtons: [] as { text: string; onPress: () => void }[],
    moreRepliesUrl: "",
    repliesInfo: null as {
      oid: string | number;
      root: string | number;
      type: number;
    } | null,
    checkLiveTimeStamp: Date.now(),
    playingSong: null as MusicSong | null,
    releaseList: [] as {
      version: string;
      changelog: string;
      apkLink: string;
    }[],
    requestDynamicFailed: 0,
    reloadUerProfile: 0,
    // dynamicWebviewLink: '',
    // dynamicOpenUrl: 0,
  };
};

const initValue = getAppValue();
const appStore = createStore("AppStore", initValue);
const storedKeys = Object.keys(initValue).filter((key): key is StoredKeys => key.startsWith("$"));
export const useStore = appStore.useStore;

export type AppContextValueType = ReturnType<typeof getAppValue>;

export type AppContextMethodsType = AtomicStoreMethodsType<AppContextValueType>;

type StoredKeys<K extends keyof AppContextValueType = keyof AppContextValueType> = K extends `$${string}`
  ? K
  : never;
type StoreSetterKey<K extends string> = `set${K}`;
type StoreSetterValue<K extends StoredKeys> =
  | AppContextValueType[K]
  | ((value: AppContextValueType[K]) => AppContextValueType[K]);

async function hydrateStoredValue<K extends StoredKeys>(
  methods: AppContextMethodsType,
  key: K,
) {
  const data = await AsyncStorage.getItem(StoragePrefix + key);
  if (!data) {
    return;
  }
  if (key === "$videoCatesList") {
    const list = JSON.parse(data) as typeof RanksConfig;
    RanksConfig.forEach((r) => {
      if (!list.find((v) => v.rid === r.rid)) {
        list.push({ ...r });
      }
    });
    methods.set$videoCatesList(list);
    return;
  }
  const setKey = `set${key}` as StoreSetterKey<K>;
  const setValue = methods[setKey] as (value: StoreSetterValue<K>) => void;
  setValue(JSON.parse(data) as AppContextValueType[K]);
}

export function InitStoreComp() {
  React.useEffect(() => {
    const methods = appStore.getStoreMethods();
    let unsubscribe: (() => void) | undefined;
    let canceled = false;

    Promise.all(
      storedKeys.map((key) => hydrateStoredValue(methods, key)),
    ).then(() => {
      if (canceled) {
        return;
      }
      methods.setInitialed(true);
      unsubscribe = appStore.subscribeStore(({ key, value }) => {
        if (key.startsWith("$")) {
          void AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(value));
        }
      });
      setTimeout(() => {
        void SplashScreen.hideAsync();
      }, 100);
    });

    return () => {
      canceled = true;
      unsubscribe?.();
    };
  }, []);
  return null;
}
