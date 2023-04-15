import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy } from 'valtio'
import { watch } from 'valtio/utils'
import { RanksConfig } from '../constants'

interface UserInfo {
  mid: number | string
  name: string
  face: string
  sign: string
  // fans: number
  // subs: number
}

const store = proxy<{
  $blackUps: Record<string, string>
  $followedUps: UserInfo[]
  $blackTags: Record<string, string>
  $userInfo: UserInfo | null
  $webViewMode: 'PC' | 'MOBILE'
  $latestUpdateIds: Record<string, string>
  $ignoredVersions: string[]
  $ranksList: { rid: number; label: string }[]
  // ----------------------------
  dynamicUser: UserInfo | null
  updatedUps: Record<string, boolean>
  livingUps: Record<string, string>
  checkingUpdateMap: Record<string, boolean>
  videosType: (typeof RanksConfig)[number]
}>({
  $blackUps: {},
  $followedUps: [],
  $blackTags: {},
  $userInfo: null,
  $webViewMode: 'PC',
  $latestUpdateIds: {},
  $ignoredVersions: [],
  $ranksList: RanksConfig,
  // -------------------------
  dynamicUser: null,
  updatedUps: {},
  livingUps: {},
  checkingUpdateMap: {},
  videosType: RanksConfig[0],
})

const StoragePrefix = 'Store:'

Object.keys(store)
  // 以$开头的数据表示需要持久化存储
  .filter(k => k.startsWith('$'))
  .forEach((k: string) => {
    type Keys = keyof typeof store
    type StoredKeys<K extends Keys> = K extends `$${string}` ? K : never
    const key = k as StoredKeys<Keys>
    AsyncStorage.getItem(StoragePrefix + key)
      .then(data => {
        if (data) {
          store[key] = JSON.parse(data)
        }
      })
      .then(() => {
        watch(get => {
          const data = get(store)[key]
          AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(data))
        })
      })
  })

export default store
