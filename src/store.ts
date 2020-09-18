import { reactive } from 'vue'
import { Store } from './types'

const store = reactive<Store>({
  currentVideo: null,
  currentUp: null,
  currentCate: null,
  userInfo: null,
  ups: null,
  ranks: {},
  upVideos: {},
  isFullScreen: false
})

if (process.env.NODE_ENV === 'development') {
  console.log('store', store)
  // @ts-ignore
  window._store = store
}


export default store
