import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import type { DynamicItemAllType } from './api/dynamic-items'
// import { VideoInfo } from './api/video-info'
// import { getInitVideoInfoValue } from './store/play'

export type PromiseResult<T extends Promise<any>> =
  T extends Promise<infer R> ? R : never

export interface UpInfo {
  mid: number | string
  name: string
  face: string
  sign: string
  pin?: number
}

export interface CollectVideoInfo {
  bvid: string
  name: string
  title: string
  cover: string
  date: string | number
  duration: string | number
  mid: string | number
  // ---
  desc?: string
  tag?: string
  face?: string
  aid?: number | string
  danmaku?: number
  play?: number
  like?: number
}

export interface HistoryVideoInfo extends CollectVideoInfo {
  watchProgress: number
  watchTime: number
}

export type RootStackParamList = {
  Welcome: undefined
  SearchUps: undefined
  SearchVideos: undefined
  Collect: undefined
  History: undefined
  Music: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play: {
    bvid: string
    title: string
    cid?: number
    aid?: string | number
    mid?: string | number
    name?: string
    face?: string
    cover?: string
    desc?: string
    date?: number | string
    tag?: string
  }
  Dynamic?: {
    from?: string
    user: UpInfo
  }
  DynamicDetail: {
    // detail: DynamicItemAllType
    title: string
    url: string
  }
  VideoList: undefined
  Follow: undefined
  About: undefined
  Living: { url: string; title: string }
}

export type NavigationProps = NativeStackScreenProps<RootStackParamList>
