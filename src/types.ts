import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicItemAllType } from './api/dynamic-items'

export type PromiseResult<T extends Promise<any>> = T extends Promise<infer R>
  ? R
  : never

export type VideoInfo = {
  bvid: string
  name: string
  face: string
  mid: number | string
  pubDate?: number | string
  title: string
  aid: number | string
  cover: string
  desc: string
}

export interface UpInfo {
  mid: number | string
  name: string
  face: string
  sign: string
}

export type RootStackParamList = {
  Home: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play: {
    bvid: string
    video?: VideoInfo
  }
  Dynamic?: {
    from?: string
    user: UpInfo
  }
  DynamicDetail: {
    detail: DynamicItemAllType
  }
  VideoList: {
    query: number
  }
  Follow: undefined
  About: undefined
}

// export type GetFuncPromiseType<F extends (...a: any) => any> =
//   ReturnType<F> extends Promise<infer R> ? R : never

export type NavigationProps = NativeStackScreenProps<RootStackParamList>
