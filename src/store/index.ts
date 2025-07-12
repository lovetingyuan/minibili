import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import React from 'react'
import {
  type AtomicContextMethodsType,
  type ContextOnChangeType,
  createAtomicContext,
  useAtomicContext,
} from 'react-atomic-context'

import { RanksConfig } from '../constants'
import useMounted from '../hooks/useMounted'
import type { CollectVideoInfo, HistoryVideoInfo, UpInfo } from '../types'
import type { MusicSong, UpdateUpInfo } from './types'

const StoragePrefix = 'Store:'

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
    dynamicWebviewLink: '',
    dynamicOpenUrl: 0,
  }
}

const initValue = getAppValue()
const AppContext = createAtomicContext(initValue)
const storedKeys = Object.keys(initValue).filter((k) =>
  k.startsWith('$'),
) as StoredKeys[]
export function useAppValue() {
  return React.useMemo(() => getAppValue(), [])
}
export function useStore() {
  return useAtomicContext(AppContext)
}

export const AppContextProvider = AppContext.Provider

export type AppContextValueType = ReturnType<typeof getAppValue>

export type AppContextMethodsType =
  AtomicContextMethodsType<AppContextValueType>

export const onChange: ContextOnChangeType<AppContextValueType> = (
  { key, value },
  ctx,
) => {
  if (!ctx.getInitialed()) {
    return
  }
  if (key.startsWith('$')) {
    AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(value))
  }
}

type StoredKeys<K = keyof AppContextValueType> = K extends `$${string}`
  ? K
  : never

export const InitStoreComp = React.memo(function InitStoreComp() {
  const methods = useAtomicContext(AppContext)
  useMounted(() => {
    Promise.all(
      storedKeys.map((k) => {
        const key = k as StoredKeys
        const setKey = `set${key}` as const
        return AsyncStorage.getItem(StoragePrefix + key).then((data) => {
          if (data) {
            if (key === '$videoCatesList') {
              const list = JSON.parse(data) as typeof RanksConfig
              RanksConfig.forEach((r) => {
                if (!list.find((v) => v.rid === r.rid)) {
                  list.push({ ...r })
                }
              })
              methods.set$videoCatesList(list)
            } else {
              methods[setKey](JSON.parse(data))
            }
          }
        })
      }),
    ).then(() => {
      methods.setInitialed(true)
      setTimeout(() => {
        SplashScreen.hideAsync()
      }, 100)
    })
  })
  return null
})
