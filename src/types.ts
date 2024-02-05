import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicItemAllType } from './api/dynamic-items'
import { VideoInfo } from './api/video-info'

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
  Home: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play: { bvid: string } & Partial<VideoInfo>
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
