import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { createStore, type AtomicStoreMethodsType } from "react-atomic-store";
import Toast from "react-native-simple-toast";

import { RanksConfig } from "../constants";
import type { VideoDownloadTask } from "../features/video-download/types";
import type { UpInfo } from "../types";
import type { WatchProgressSnapshot } from "../utils/watch-progress";
import type { FollowingDynamicsReadState } from "../api/following-dynamics.types";
import { clearLegacyCollections } from "./legacy-collections";
import type { PartPlayProgressMap } from "./part-play-progress.types";
import type { RepliesInfo } from "./replies-info.type";
import type { FollowingDynamicsUpdateState } from "./types";

const StoragePrefix = "Store:";

const getAppValue = () => {
  return {
    /**
     * 首次运行的时间
     */
    $firstRun: -1,
    /**
     * 关注的up主
     */
    $followedUps: [] as UpInfo[],
    /**
     * 动态 tab 的已读基线和未读更新数，按 B站账号 mid 存储
     */
    $followingDynamicsUpdateMap: {} as Record<string, FollowingDynamicsUpdateState>,
    /**
     * 关注列表每个 UP 的最新/已读动态 id，按 B站账号 mid 存储
     */
    $followingDynamicsReadMap: {} as Record<string, FollowingDynamicsReadState>,
    /**
     * 当前会话已经成功同步 feed/nav 的账号；同步前不展示本地红点
     */
    followingDynamicsNavReadyAccount: null as {
      mid: string;
      generation: number;
    } | null,
    // $ignoredVersions: [] as string[],
    $watchedHotSearch: {} as Record<string, number>,
    $checkAppUpdateTime: 0,
    // -------------------------
    initialed: false,
    // 仅当前运行会话的完整 B站同步才激活磁盘缓存。
    followingsGeneration: -1,
    isWiFi: false,
    webViewMode: "MOBILE" as "PC" | "MOBILE",
    /**
     * 播放器内弹幕开关，默认开启
     */
    $danmakuEnabled: true,
    /**
     * 是否允许 App 退到后台继续播放
     */
    $backgroundPlayEnabled: false,
    /**
     * 每个分P 的本地续播位置，按 `bvid:cid` 持久化。
     */
    $partPlayProgressMap: {} as PartPlayProgressMap,
    livingUps: {} as Record<string, string>,
    followingDynamicsUpdateCount: 0,
    currentVideosCate: RanksConfig[0] as (typeof RanksConfig)[number],
    imagesList: [] as {
      src: string;
      width: number;
      height: number;
      ratio?: number;
    }[],
    currentImageIndex: 0,
    overlayButtons: [] as { text: string; onPress: () => void }[],
    /**
     * 稍后再看视频 aid 集合，仅当前运行会话有效，不做持久化
     */
    watchLaterAids: {} as Record<string, true>,
    /**
     * bvid → 观看历史接口返回的进度快照（比例 + 观看时间），仅当前运行会话有效，不做持久化
     */
    watchProgressMap: {} as Record<string, WatchProgressSnapshot>,
    /**
     * 当前的视频下载任务，仅当前运行会话有效，不做持久化
     */
    videoDownloadTask: null as VideoDownloadTask | null,
    moreRepliesUrl: "",
    repliesInfo: null as RepliesInfo | null,
    releaseList: [] as {
      version: string;
      changelog: string;
      apkLink: string;
    }[],
    // dynamicWebviewLink: '',
    // dynamicOpenUrl: 0,
  };
};

const initValue = getAppValue();
const { getStoreMethods, useStore, subscribeStore } = createStore("AppStore", initValue);
export { getStoreMethods, useStore };
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

function getDefaultStoredValue<K extends StoredKeys>(key: K): AppContextValueType[K] {
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

async function hydrateStoredValue<K extends StoredKeys>(methods: AppContextMethodsType, key: K) {
  const data = await AsyncStorage.getItem(StoragePrefix + key);
  if (!data) {
    return false;
  }
  try {
    const parsed = JSON.parse(data) as unknown;
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
    let hideSplashTimer: ReturnType<typeof setTimeout> | undefined;
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
      hideSplashTimer = setTimeout(() => {
        void SplashScreen.hideAsync().finally(() => {
          if (toastMessage) {
            Toast.show(toastMessage, Toast.SHORT);
          }
        });
      }, 100);
    };

    Promise.allSettled([
      Promise.all(storedKeys.map((key) => hydrateStoredValue(methods, key))),
      clearLegacyCollections((key) => AsyncStorage.removeItem(key)),
    ])
      .then(([hydration, cleanup]) => {
        const hasResetValues = hydration.status === "fulfilled" && hydration.value.some(Boolean);
        const clearedCollections = cleanup.status === "fulfilled" && cleanup.value;
        const notices = [
          hydration.status === "rejected" ? "应用数据恢复失败，已使用默认配置启动" : "",
          hasResetValues ? "部分本地数据异常，已重置默认值" : "",
          clearedCollections ? "" : "旧收藏或观看历史数据清理失败，将在下次启动重试",
        ].filter(Boolean);
        finishHydration(notices.join("；") || undefined);
      })
      .catch(() => {
        finishHydration("应用数据恢复失败，已使用默认配置启动");
      });

    return () => {
      canceled = true;
      clearTimeout(hideSplashTimer);
      unsubscribe?.();
    };
  }, []);
  return null;
}
