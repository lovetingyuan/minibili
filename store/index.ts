import AsyncStorage from '@react-native-async-storage/async-storage'
import { proxy } from 'valtio'
import { watch } from 'valtio/utils'
import { UserInfo } from '../types'

const syncStoreKeys = [
  'blackUps',
  'followedUps',
  'blackTags',
  'userInfo',
  // 'specialUser',
  'webViewMode',
  'hideWatched',
] as const

const store = proxy<{
  blackUps: Record<string, string>
  followedUps: UserInfo[]
  blackTags: Record<string, boolean>
  userInfo: UserInfo | null
  // specialUser: UserInfo | null
  webViewMode: 'PC' | 'MOBILE'
  topUps: (string | number)[]
  dynamicUser: UserInfo | null
  updatedUps: Record<string, boolean>
  livingUps: Record<string, boolean>
  showBlackDialog: number
  hideWatched: boolean
}>({
  blackUps: {},
  followedUps: [],
  blackTags: {},
  userInfo: null,
  // specialUser: null,
  webViewMode: 'PC',
  topUps: [],
  // ----
  dynamicUser: null,
  updatedUps: {},
  livingUps: {},
  showBlackDialog: 0,
  hideWatched: false,
})

Promise.all(
  syncStoreKeys.map(k => {
    return AsyncStorage.getItem(k).then(data => [k, data])
  }),
)
  .then(res => {
    for (let i = 0; i < res.length; i++) {
      const [k, data] = res[i]
      if (data) {
        // @ts-ignore
        store[k] = JSON.parse(data)
      }
    }
    store.dynamicUser = store.userInfo ? { ...store.userInfo } : null
  })
  .then(() => {
    watch(get => {
      for (let k of syncStoreKeys) {
        const data = get(store)[k as keyof typeof store]
        AsyncStorage.setItem(k, JSON.stringify(data))
      }
    })
  })

export default store
