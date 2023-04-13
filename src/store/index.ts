import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy } from 'valtio'
import { watch } from 'valtio/utils'

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
  // ----------------------------
  dynamicUser: UserInfo | null
  updatedUps: Record<string, boolean>
  livingUps: Record<string, string>
  checkingUpdateMap: Record<string, boolean>
}>({
  $blackUps: {},
  $followedUps: [],
  $blackTags: {},
  $userInfo: null,
  $webViewMode: 'PC',
  $latestUpdateIds: {},
  $ignoredVersions: [],
  // -------------------------
  dynamicUser: null,
  updatedUps: {},
  livingUps: {},
  checkingUpdateMap: {},
})

const StoragePrefix = 'Store:'

Object.keys(store)
  // 以$开头的数据表示需要持久化存储
  .filter(k => k.startsWith('$'))
  .forEach((k: string) => {
    const key = k as keyof typeof store
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
