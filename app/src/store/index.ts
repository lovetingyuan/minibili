import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import React from 'react'
import { createStore, type AtomicStoreMethodsType } from 'react-atomic-store'
import Toast from 'react-native-simple-toast'

import { RanksConfig } from '../constants'
import type { AuthFailureReason, AuthModalMode } from '../features/user-sync/types'
import type { CollectVideoInfo, HistoryVideoInfo, UpInfo } from '../types'
import type { MusicSong, UpdateUpInfo } from './types'

const StoragePrefix = 'Store:'

export const SyncToServerKeys = [
  '$blackUps',
  '$followedUps',
  '$blackTags',
  '$videoCatesList',
  '$collectedVideos',
  '$watchedVideos',
  '$musicList',
] as const

const syncToServerKeySet = new Set<string>(SyncToServerKeys)

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
        name: '默认',
        songs: [],
      },
    ] as {
      name: string
      songs: MusicSong[]
    }[],
    $watchedHotSearch: {} as Record<string, number>,
    $checkAppUpdateTime: 0,
    // -------------------------
    initialed: false,
    authReady: false,
    isAuthenticated: false,
    authEmail: null as string | null,
    authModalVisible: false,
    authModalMode: 'login' as AuthModalMode,
    authFailureReason: null as AuthFailureReason | null,
    isWiFi: false,
    webViewMode: 'MOBILE' as 'PC' | 'MOBILE',
    livingUps: {} as Record<string, string>,
    currentVideosCate: RanksConfig[0] as (typeof RanksConfig)[number],
    imagesList: [] as {
      src: string
      width: number
      height: number
      ratio?: number
    }[],
    currentImageIndex: 0,
    overlayButtons: [] as { text: string; onPress: () => void }[],
    moreRepliesUrl: '',
    repliesInfo: null as {
      oid: string | number
      root: string | number
      type: number
    } | null,
    checkLiveTimeStamp: Date.now(),
    playingSong: null as MusicSong | null,
    releaseList: [] as {
      version: string
      changelog: string
      apkLink: string
    }[],
    requestDynamicFailed: 0,
    reloadUerProfile: 0,
    // dynamicWebviewLink: '',
    // dynamicOpenUrl: 0,
  }
}

const initValue = getAppValue()
export const { getStoreMethods, useStore, subscribeStore } = createStore('AppStore', initValue)
const storedKeys = Object.keys(initValue).filter((key): key is StoredKeys => key.startsWith('$'))

export type AppContextValueType = ReturnType<typeof getAppValue>

export type AppContextMethodsType = AtomicStoreMethodsType<AppContextValueType>

export type StoredKeys<K extends keyof AppContextValueType = keyof AppContextValueType> =
  K extends `$${string}` ? K : never
export type SyncToServerKey = (typeof SyncToServerKeys)[number]
export type SyncToServerSnapshot = Pick<AppContextValueType, SyncToServerKey>
type StoreSetterKey<K extends string> = `set${K}`
type StoreGetterKey<K extends string> = `get${K}`
type StoreSetterValue<K extends StoredKeys> =
  | AppContextValueType[K]
  | ((value: AppContextValueType[K]) => AppContextValueType[K])

function forEachSyncToServerKey(callback: <K extends SyncToServerKey>(key: K) => void) {
  SyncToServerKeys.forEach(key => {
    callback(key)
  })
}

function setSyncSnapshotValue<K extends SyncToServerKey>(
  snapshot: Partial<SyncToServerSnapshot>,
  key: K,
  value: SyncToServerSnapshot[K],
) {
  snapshot[key] = value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneStoredValue<K extends StoredKeys>(value: AppContextValueType[K]): AppContextValueType[K] {
  return JSON.parse(JSON.stringify(value)) as AppContextValueType[K]
}

export function getDefaultStoredValue<K extends StoredKeys>(key: K): AppContextValueType[K] {
  return cloneStoredValue(getAppValue()[key])
}

function isCompatibleStoredValue<K extends StoredKeys>(
  value: unknown,
  defaultValue: AppContextValueType[K],
): value is AppContextValueType[K] {
  if (defaultValue === null) {
    return value === null
  }
  if (Array.isArray(defaultValue)) {
    return Array.isArray(value)
  }
  if (isPlainObject(defaultValue)) {
    return isPlainObject(value)
  }
  return typeof value === typeof defaultValue
}

function normalizeVideoCatesList(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }
  const list = value.filter((item): item is (typeof RanksConfig)[number] => {
    return isPlainObject(item) && typeof item.rid === 'number'
  })
  if (list.length === 0) {
    return null
  }
  const nextList = list.map(item => ({ ...item }))
  RanksConfig.forEach(rank => {
    if (!nextList.find(item => item.rid === rank.rid)) {
      nextList.push({ ...rank })
    }
  })
  return nextList
}

function getStoredValue<K extends StoredKeys>(
  methods: AppContextMethodsType,
  key: K,
): AppContextValueType[K] {
  const getterKey = `get${key}` as StoreGetterKey<K>
  const getter = methods[getterKey] as () => AppContextValueType[K]
  return getter()
}

export function isSyncToServerKey(key: string): key is SyncToServerKey {
  return syncToServerKeySet.has(key)
}

export function normalizeSyncToServerValue<K extends SyncToServerKey>(
  key: K,
  value: unknown,
): AppContextValueType[K] {
  if (key === '$videoCatesList') {
    const list = normalizeVideoCatesList(value)
    if (list) {
      return list as AppContextValueType[K]
    }
    return getDefaultStoredValue(key)
  }

  const defaultValue = getDefaultStoredValue(key)
  if (isCompatibleStoredValue(value, defaultValue)) {
    return cloneStoredValue(value as AppContextValueType[K])
  }

  return defaultValue
}

export function setStoredValue<K extends StoredKeys>(
  methods: AppContextMethodsType,
  key: K,
  value: AppContextValueType[K],
) {
  const setKey = `set${key}` as StoreSetterKey<K>
  const setValue = methods[setKey] as (nextValue: StoreSetterValue<K>) => void
  setValue(value)
}

export function applySyncToServerSnapshot(
  snapshot: Partial<SyncToServerSnapshot>,
  methods = getStoreMethods(),
) {
  forEachSyncToServerKey(key => {
    const value = snapshot[key]
    if (value !== undefined) {
      setStoredValue(methods, key, value)
    }
  })
}

export function getDefaultSyncToServerSnapshot(): SyncToServerSnapshot {
  const snapshot = {} as SyncToServerSnapshot
  forEachSyncToServerKey(key => {
    setSyncSnapshotValue(snapshot, key, getDefaultStoredValue(key))
  })
  return snapshot
}

export function getSyncToServerSnapshot(methods = getStoreMethods()): SyncToServerSnapshot {
  const snapshot = {} as SyncToServerSnapshot
  forEachSyncToServerKey(key => {
    setSyncSnapshotValue(snapshot, key, cloneStoredValue(getStoredValue(methods, key)))
  })
  return snapshot
}

async function hydrateStoredValue<K extends StoredKeys>(methods: AppContextMethodsType, key: K) {
  const data = await AsyncStorage.getItem(StoragePrefix + key)
  if (!data) {
    return false
  }
  try {
    const parsed = JSON.parse(data) as unknown
    if (key === '$videoCatesList') {
      const list = normalizeVideoCatesList(parsed)
      if (list) {
        methods.set$videoCatesList(list)
        return false
      }
      methods.set$videoCatesList(getDefaultStoredValue(key as '$videoCatesList'))
      return true
    }
    const defaultValue = getDefaultStoredValue(key)
    const setKey = `set${key}` as StoreSetterKey<K>
    const setValue = methods[setKey] as (value: StoreSetterValue<K>) => void
    if (isCompatibleStoredValue(parsed, defaultValue)) {
      setValue(parsed)
      return false
    }
  } catch {
    // ignore and reset to default below
  }
  const setKey = `set${key}` as StoreSetterKey<K>
  const setValue = methods[setKey] as (value: StoreSetterValue<K>) => void
  setValue(getDefaultStoredValue(key))
  return true
}

export function InitStoreComp() {
  React.useEffect(() => {
    const methods = getStoreMethods()
    let unsubscribe: (() => void) | undefined
    let canceled = false

    const finishHydration = (toastMessage?: string) => {
      if (canceled) {
        return
      }
      methods.setInitialed(true)
      unsubscribe = subscribeStore(({ key, value }) => {
        if (key.startsWith('$')) {
          void AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(value))
        }
      })
      setTimeout(() => {
        void SplashScreen.hideAsync().finally(() => {
          if (toastMessage) {
            Toast.show(toastMessage, Toast.SHORT)
          }
        })
      }, 100)
    }

    Promise.all(storedKeys.map(key => hydrateStoredValue(methods, key)))
      .then(resetStates => {
        const hasResetValues = resetStates.some(Boolean)
        finishHydration(hasResetValues ? '部分本地数据异常，已重置默认值' : undefined)
      })
      .catch(() => {
        finishHydration('应用数据恢复失败，已使用默认配置启动')
      })

    return () => {
      canceled = true
      unsubscribe?.()
    }
  }, [])
  return null
}
