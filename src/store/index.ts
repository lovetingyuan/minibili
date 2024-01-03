import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy, subscribe, useSnapshot } from 'valtio'
import { RanksConfig } from '../constants'
import { checkUpdate } from '../api/check-update'
import { UpInfo } from '../types'
// import { registerCheckLivingUps } from '../utils/check-live'
// import { showToast } from '../utils'
// import { subscribeKey } from 'valtio/utils'
// import { startCheckLivingUps } from '../api/living-info'
import { startCheckUpdateUps } from '../api/dynamic-items'

interface UpdateUpInfo {
  latestId: string
  currentLatestId: string
}

const store = proxy<{
  $blackUps: Record<string, string>
  /**
   * 关注列表
   */
  $followedUps: UpInfo[]
  $blackTags: Record<string, string>
  $upUpdateMap: Record<string, UpdateUpInfo>
  $videoCatesList: { rid: number; label: string }[]
  $ignoredVersions: string[]
  $cookie: string
  // $cachedHotVideos: VideoItem[]
  // $pinUps: Record<string, number>
  // ----------------------------
  followedUpsMap: Record<string, UpInfo>
  initialed: boolean
  isWiFi: boolean
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
  moreRepliesUrl: string
  testid: number
}>({
  $blackUps: {},
  $followedUps: [],
  get followedUpsMap() {
    // console.log('followedUpsMapfollowedUpsMapfollowedUpsMap')
    const ups: Record<string, UpInfo> = {}
    for (const up of this.$followedUps) {
      ups[up.mid] = up
    }
    return ups
  },
  $blackTags: {},
  $upUpdateMap: {},
  $ignoredVersions: [],
  $videoCatesList: RanksConfig,
  $cookie: '',
  // $cachedHotVideos: [],
  // $pinUps: {},
  // -------------------------
  initialed: false,
  isWiFi: false,
  webViewMode: 'MOBILE',
  livingUps: {},
  checkingUpUpdate: false,
  currentVideosCate: RanksConfig[0],
  appUpdateInfo: checkUpdate(),
  imagesList: [],
  currentImageIndex: 0,
  overlayButtons: [],
  showCaptcha: false,
  testid: 0,
  get updatedCount() {
    const aa = Object.values<UpdateUpInfo>(this.$upUpdateMap)
    return aa.filter(item => {
      return item.latestId !== item.currentLatestId
    }).length
  },
  moreRepliesUrl: '',
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
)
  .then(() => {
    store.initialed = true
    // subscribeKey(store, '$followedUps', v =>
    //   console.log('$followedUps has changed to', v),
    // )
    subscribe(store, changes => {
      const changedKeys = new Set<StoredKeys>()
      for (const op of changes) {
        const ck = op[1][0]
        if (typeof ck === 'string' && ck.startsWith('$')) {
          changedKeys.add(ck as StoredKeys)
        }
      }
      // console.log('chencged', [...changedKeys])
      for (const ck of changedKeys) {
        AsyncStorage.setItem(StoragePrefix + ck, JSON.stringify(store[ck]))
      }
    })
  })
  .then(() => {
    // startCheckLivingUps()
    startCheckUpdateUps()
    // return registerCheckLivingUps().then(good => {
    //   if (!good) {
    //     showToast('检查直播失败')
    //   }
    // })
  })

export function useStore() {
  return useSnapshot(store)
}

export function setStore(callback: (s: typeof store) => void) {
  callback(store)
}

export default store
