import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import React from 'react'
import {
  createAtomicContext,
  type ProviderOnChangeType,
  useAtomicContext,
  useAtomicContextMethods,
} from 'react-atomic-context'

import { checkUpdate } from '../api/check-update'
import { RanksConfig } from '../constants'
import useMounted from '../hooks/useMounted'
import type { CollectVideoInfo, UpInfo } from '../types'

interface UpdateUpInfo {
  latestId: string
  currentLatestId: string
}

export const getAppValue = () => {
  return {
    /**
     * 首次运行的时间
     */
    $firstRun: 0,
    /**
     * 拉黑的up主
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
    _followedUpsMap: {} as Record<string, UpInfo>,
    _updatedCount: 0,
    _collectedVideosMap: {} as Record<string, CollectVideoInfo>,
    moreRepliesUrl: '',
    checkLiveTimeStamp: Date.now(),
  }
}

const initValue = getAppValue()
const AppContext = createAtomicContext(initValue)
const storedKeys = Object.keys(initValue).filter(k =>
  k.startsWith('$'),
) as StoredKeys[]

export const getAppUpdateInfo = checkUpdate()

export function useStore() {
  return useAtomicContext(AppContext)
}
export function useMethods() {
  return useAtomicContextMethods(AppContext)
}
export const AppContextProvider = AppContext.Provider

export type AppContextValueType = ReturnType<typeof getAppValue>

export const onChange: ProviderOnChangeType<AppContextValueType> = (
  { key, value },
  ctx,
) => {
  if (key === '$followedUps') {
    const ups: Record<string, UpInfo> = {}
    for (const up of value) {
      ups[up.mid] = up
    }
    ctx.set_followedUpsMap(ups)
  }
  if (key === '$upUpdateMap') {
    const aa = Object.values<UpdateUpInfo>(value)
    const count = aa.filter(item => {
      return item.latestId !== item.currentLatestId
    }).length
    ctx.set_updatedCount(count)
  }
  if (key === '$collectedVideos') {
    const _map: Record<string, CollectVideoInfo> = {}
    value.forEach(vi => {
      _map[vi.bvid] = vi
    })
    ctx.set_collectedVideosMap(_map)
  }
  if (!ctx.getInitialed()) {
    return
  }
  if (key.startsWith('$')) {
    AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(value))
  }
}

const StoragePrefix = 'Store:'

type StoredKeys<K = keyof AppContextValueType> = K extends `$${string}`
  ? K
  : never

export const InitContextComp = React.memo(() => {
  const methods = useAtomicContextMethods(AppContext)
  useMounted(() => {
    Promise.all(
      storedKeys.map(k => {
        const key = k as StoredKeys
        const setKey = `set${key}` as const
        return AsyncStorage.getItem(StoragePrefix + key).then(data => {
          if (data) {
            if (key === '$videoCatesList') {
              const list = JSON.parse(data) as typeof RanksConfig
              RanksConfig.forEach(r => {
                if (!list.find(v => v.rid === r.rid)) {
                  list.push({ ...r })
                }
              })
              methods.set$videoCatesList(list)
            } else {
              methods[setKey](JSON.parse(data) as any)
            }
          }
        })
      }),
    ).then(() => {
      methods.setInitialed(true)
      SplashScreen.hideAsync()
    })
  })
  return null
})
