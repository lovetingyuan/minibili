import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { createStore, type AtomicStoreMethodsType } from "react-atomic-store";
import Toast from "react-native-simple-toast";

import { RanksConfig } from "../constants";
import type { CollectVideoInfo, HistoryVideoInfo, UpInfo } from "../types";
import type { RepliesInfo } from "./replies-info.type";
import type { MusicSong, UpdateUpInfo } from "./types";

const StoragePrefix = "Store:";

const getAppValue = () => {
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
    // $ignoredVersions: [] as string[],
    $videoCatesList: RanksConfig,
    $collectedVideos: [] as CollectVideoInfo[],
    $watchedVideos: {} as Record<string, HistoryVideoInfo>,
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
    repliesInfo: null as RepliesInfo | null,
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
export const { getStoreMethods, useStore, subscribeStore } = createStore("AppStore", initValue);
const storedKeys = Object.keys(initValue).filter((key): key is StoredKeys => key.startsWith("$"));

export type AppContextValueType = ReturnType<typeof getAppValue>;

export type AppContextMethodsType = AtomicStoreMethodsType<AppContextValueType>;

export type StoredKeys<K extends keyof AppContextValueType = keyof AppContextValueType> =
  K extends `$${string}` ? K : never;
type StoreSetterKey<K extends string> = `set${K}`;
type StoreSetterValue<K extends StoredKeys> =
  | AppContextValueType[K]
  | ((value: AppContextValueType[K]) => AppContextValueType[K]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneStoredValue<K extends StoredKeys>(
  value: AppContextValueType[K],
): AppContextValueType[K] {
  return JSON.parse(JSON.stringify(value)) as AppContextValueType[K];
}

export function getDefaultStoredValue<K extends StoredKeys>(key: K): AppContextValueType[K] {
  return cloneStoredValue(getAppValue()[key]);
}

function isCompatibleStoredValue<K extends StoredKeys>(
  value: unknown,
  defaultValue: AppContextValueType[K],
): value is AppContextValueType[K] {
  if (defaultValue === null) {
    return value === null;
  }
  if (Array.isArray(defaultValue)) {
    return Array.isArray(value);
  }
  if (isPlainObject(defaultValue)) {
    return isPlainObject(value);
  }
  return typeof value === typeof defaultValue;
}

function normalizeVideoCatesList(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }
  const list = value.filter((item): item is (typeof RanksConfig)[number] => {
    return isPlainObject(item) && typeof item.rid === "number";
  });
  if (list.length === 0) {
    return null;
  }
  const nextList = list.map((item) => ({ ...item }));
  RanksConfig.forEach((rank) => {
    if (!nextList.find((item) => item.rid === rank.rid)) {
      nextList.push({ ...rank });
    }
  });
  return nextList;
}

async function hydrateStoredValue<K extends StoredKeys>(methods: AppContextMethodsType, key: K) {
  const data = await AsyncStorage.getItem(StoragePrefix + key);
  if (!data) {
    return false;
  }
  try {
    const parsed = JSON.parse(data) as unknown;
    if (key === "$videoCatesList") {
      const list = normalizeVideoCatesList(parsed);
      if (list) {
        methods.set$videoCatesList(list);
        return false;
      }
      methods.set$videoCatesList(getDefaultStoredValue(key as "$videoCatesList"));
      return true;
    }
    const defaultValue = getDefaultStoredValue(key);
    const setKey = `set${key}` as StoreSetterKey<K>;
    const setValue = methods[setKey] as (value: StoreSetterValue<K>) => void;
    if (isCompatibleStoredValue(parsed, defaultValue)) {
      setValue(parsed);
      return false;
    }
  } catch {
    // ignore and reset to default below
  }
  const setKey = `set${key}` as StoreSetterKey<K>;
  const setValue = methods[setKey] as (value: StoreSetterValue<K>) => void;
  setValue(getDefaultStoredValue(key));
  return true;
}

export function InitStoreComp() {
  React.useEffect(() => {
    const methods = getStoreMethods();
    let unsubscribe: (() => void) | undefined;
    let canceled = false;

    const finishHydration = (toastMessage?: string) => {
      if (canceled) {
        return;
      }
      methods.setInitialed(true);
      unsubscribe = subscribeStore(({ key, value }) => {
        if (key.startsWith("$")) {
          void AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(value));
        }
      });
      setTimeout(() => {
        void SplashScreen.hideAsync().finally(() => {
          if (toastMessage) {
            Toast.show(toastMessage, Toast.SHORT);
          }
        });
      }, 100);
    };

    Promise.all(storedKeys.map((key) => hydrateStoredValue(methods, key)))
      .then((resetStates) => {
        const hasResetValues = resetStates.some(Boolean);
        finishHydration(hasResetValues ? "部分本地数据异常，已重置默认值" : undefined);
      })
      .catch(() => {
        finishHydration("应用数据恢复失败，已使用默认配置启动");
      });

    return () => {
      canceled = true;
      unsubscribe?.();
    };
  }, []);
  return null;
}
