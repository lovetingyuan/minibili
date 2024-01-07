import AsyncStorage from '@react-native-async-storage/async-storage'
import { RanksConfig } from '../constants'
import { checkUpdate } from '../api/check-update'
import { UpInfo } from '../types'
import {
  ProviderOnChangeType,
  createAtomicContext,
  useAtomicContext,
  useAtomicContextMethods,
} from 'react-atomic-context'
import React from 'react'
import useMounted from '../hooks/useMounted'

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
      ratio: number
    }[],
    currentImageIndex: 0,
    overlayButtons: [] as { text: string; onPress: () => void }[],
    _followedUpsMap: {} as Record<string, UpInfo>,
    _updatedCount: 0,
    moreRepliesUrl: '',
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
            methods[setKey](JSON.parse(data) as any)
          }
        })
      }),
    ).then(() => {
      methods.setInitialed(true)
    })
  })
  return null
})
