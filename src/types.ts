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

export type RootStackParamList = {
  Welcome: undefined
  SearchUps: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play: {
    bvid: string
    title: string
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
    detail: DynamicItemAllType
  }
  VideoList: undefined
  Follow: undefined
  About: undefined
}

export type NavigationProps = NativeStackScreenProps<RootStackParamList>
