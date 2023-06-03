import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy, useSnapshot } from 'valtio'
import { watch } from 'valtio/utils'
import { RanksConfig, TracyId } from '../constants'
import { reportUserOpenApp } from '../utils/report'
// import { RemoteConfig, getRemoteConfig } from '../api/get-config'
import { checkUpdate } from '../api/check-update'

interface UserInfo {
  mid: number | string
  name: string
  face: string
  sign: string
}

const store = proxy<{
  $blackUps: Record<string, string>
  $followedUps: UserInfo[]
  $blackTags: Record<string, string>
  $userInfo: UserInfo | null
  webViewMode: 'PC' | 'MOBILE'
  $latestUpdateIds: Record<string, string>
  $ignoredVersions: string[]
  // ----------------------------
  updatedUps: Record<string, boolean>
  livingUps: Record<string, string>
  checkingUpUpdateMap: Record<string, boolean>
  currentVideosCate: (typeof RanksConfig)[number]
  $ranksList: { rid: number; label: string }[]
  // remoteConfig: Promise<RemoteConfig>
  updateInfo: ReturnType<typeof checkUpdate>
  imagesList: {
    src: string
    width: number
    height: number
    ratio: number
  }[]
  currentImageIndex: number
  checkingUpUpdate: boolean
  overlayButtons: { text: string; onPress: () => void }[]
  cookie: string
  showCaptcha: boolean
}>({
  $blackUps: {},
  $followedUps: [],
  $blackTags: {},
  $userInfo: null,
  $latestUpdateIds: {},
  $ignoredVersions: [],
  // -------------------------
  webViewMode: 'MOBILE',
  updatedUps: {},
  livingUps: {},
  checkingUpUpdateMap: {},
  get checkingUpUpdate() {
    return Object.values(this.checkingUpUpdateMap).filter(Boolean).length > 0
  },
  currentVideosCate: RanksConfig[0],
  $ranksList: RanksConfig,
  // remoteConfig: getRemoteConfig(),
  updateInfo: checkUpdate(),
  imagesList: [],
  currentImageIndex: 0,
  overlayButtons: [],
  cookie: 'DedeUserID=' + TracyId,
  showCaptcha: false,
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
          store[key] = JSON.parse(data) as any
          if (key === '$userInfo' && store.$userInfo) {
            store.cookie = 'DedeUserID=' + store.$userInfo.mid
            reportUserOpenApp(store.$userInfo.mid, store.$userInfo.name)
          }
        }
      })
      .then(() => {
        watch(get => {
          const data = get(store)[key]
          AsyncStorage.setItem(StoragePrefix + key, JSON.stringify(data))
        })
      })
  })

export function useStore() {
  return useSnapshot(store)
}

export function setStore(callback: (s: typeof store) => void) {
  callback(store)
}

export default store
