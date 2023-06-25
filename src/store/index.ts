import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy, subscribe, useSnapshot } from 'valtio'
import { RanksConfig, TracyId } from '../constants'
import { reportUserOpenApp } from '../utils/report'
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
  $upUpdateMap: Record<string, { latestId: string; currentLatestId: string }>
  $videoCatesList: { rid: number; label: string }[]
  $ignoredVersions: string[]
  $cookie: string
  // ----------------------------
  initialed: boolean
  webViewMode: 'PC' | 'MOBILE'
  loadingDynamicError: boolean
  livingUps: Record<string, string>
  currentVideosCate: (typeof RanksConfig)[number]
  appUpdateInfo: ReturnType<typeof checkUpdate>
  imagesList: {
    src: string
    width: number
    height: number
    ratio: number
  }[]
  currentImageIndex: number
  checkingUpUpdate: boolean
  overlayButtons: { text: string; onPress: () => void }[]
  showCaptcha: boolean
}>({
  $blackUps: {},
  $followedUps: [],
  $blackTags: {},
  $userInfo: null,
  $upUpdateMap: {},
  $ignoredVersions: [],
  $videoCatesList: RanksConfig,
  $cookie: 'DedeUserID=' + TracyId,
  // -------------------------
  initialed: false,
  webViewMode: 'MOBILE',
  loadingDynamicError: false,
  livingUps: {},
  checkingUpUpdate: false,
  currentVideosCate: RanksConfig[0],
  appUpdateInfo: checkUpdate(),
  imagesList: [],
  currentImageIndex: 0,
  overlayButtons: [],
  showCaptcha: false,
})

const StoragePrefix = 'Store:'

type StoredKeys<K = keyof typeof store> = K extends `$${string}` ? K : never

const storedKeys = Object.keys(store)
  // 以$开头的数据表示需要持久化存储
  .filter(k => k.startsWith('$')) as StoredKeys[]
Promise.all(
  storedKeys.map(k => {
    const key = k as StoredKeys
    return AsyncStorage.getItem(StoragePrefix + key).then(data => {
      if (data) {
        store[key] = JSON.parse(data) as any
        if (key === '$userInfo' && store.$userInfo) {
          reportUserOpenApp(store.$userInfo.mid, store.$userInfo.name)
        }
      }
    })
  }),
).then(() => {
  store.initialed = true
  subscribe(store, changes => {
    const changedKeys = new Set<StoredKeys>()
    for (const op of changes) {
      const ck = op[1][0]
      if (typeof ck === 'string' && ck.startsWith('$')) {
        changedKeys.add(ck as StoredKeys)
      }
    }
    for (const ck of changedKeys) {
      AsyncStorage.setItem(StoragePrefix + ck, JSON.stringify(store[ck]))
    }
  })
})

export function useStore() {
  return useSnapshot(store)
}

export function setStore(callback: (s: typeof store) => void) {
  callback(store)
}

export default store
