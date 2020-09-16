import { reactive } from 'vue'
import { Plugins } from '@capacitor/core'
import { Store } from './types'

const store = reactive<Store>({
  currentVideo: null,
  currentUp: null,
  currentCate: null,
  userInfo: null,
  ups: [],
  ranks: {},
  upVideos: {},
})

if (process.env.NODE_ENV === 'development') {
  console.log('store', store)
  // @ts-ignore
  window._store = store
}

Plugins.Storage.get({ key: 'userInfo' }).then(result => {
  if (result.value) {
    store.userInfo = JSON.parse(result.value)
  }
})

export default store
