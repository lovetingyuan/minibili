import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { reactive } from 'vue'
import { Store } from './types'

const [version, timestamp] = (document.querySelector('meta[name="version"]') as any).content.split(',')

const store = reactive<Store>({
  currentVideo: null,
  currentUp: null,
  currentCate: null,
  userInfo: null,
  ups: null,
  ranks: {},
  upVideos: {},
  isFullScreen: false,
  orientation: ScreenOrientation.type,
  version,
  publishDate: (new Date(timestamp)).toLocaleDateString()
})

if (process.env.NODE_ENV === 'development') {
  console.log('store', store)
  // @ts-ignore
  window._store = store
}


export default store
