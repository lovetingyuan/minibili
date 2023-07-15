import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy, subscribe, useSnapshot } from 'valtio'
import { RanksConfig } from '../constants'
import { checkUpdate } from '../api/check-update'

interface UserInfo {
  mid: number | string
  name: string
  face: string
  sign: string
}

interface UpdateUpInfo {
  latestId: string
  currentLatestId: string
}

const store = proxy<{
  $blackUps: Record<string, string>
  $followedUps: UserInfo[]
  $blackTags: Record<string, string>
  $upUpdateMap: Record<string, UpdateUpInfo>
  $videoCatesList: { rid: number; label: string }[]
  $ignoredVersions: string[]
  $cookie: string
  // ----------------------------
  initialed: boolean
  webViewMode: 'PC' | 'MOBILE'
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
  updatedCount: number
}>({
  $blackUps: {},
  $followedUps: [],
  $blackTags: {},
  $upUpdateMap: {},
  $ignoredVersions: [],
  $videoCatesList: RanksConfig,
  $cookie: '',
  // -------------------------
  initialed: false,
  webViewMode: 'MOBILE',
  livingUps: {},
  checkingUpUpdate: false,
  currentVideosCate: RanksConfig[0],
  appUpdateInfo: checkUpdate(),
  imagesList: [],
  currentImageIndex: 0,
  overlayButtons: [],
  showCaptcha: false,
  get updatedCount() {
    return Object.values(this.$upUpdateMap).filter(item => {
      // wtf????
      return (
        (item as UpdateUpInfo).latestId !==
        (item as UpdateUpInfo).currentLatestId
      )
    }).length
  },
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
