import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicItemAllType } from './api/dynamic-items'
// import { HandledDynamicTypeEnum } from './api/dynamic-items.type'

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

export type RootStackParamList = {
  Home: undefined
  Main: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play: {
    bvid: string
    video?: VideoInfo
  }
  Dynamic?: {
    from?: string
    user: {
      mid: string | number
      name: string
      face: string
      sign: string
    }
  }
  DynamicDetail: {
    detail: DynamicItemAllType
  }
  VideoList: {
    query: number
  }
  Follow: undefined
  About: undefined
  Login: undefined
}

// export type GetFuncPromiseType<F extends (...a: any) => any> =
//   ReturnType<F> extends Promise<infer R> ? R : never

export type NavigationProps = NativeStackScreenProps<RootStackParamList>
