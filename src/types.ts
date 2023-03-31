export type RootStackParamList = {
  Home: undefined
  Main: undefined
  WebPage: { url: string; title: string; type?: 'pc' | 'mobile' }
  Play: {
    commentId: number | string
    bvid: string
    name: string
    mid: string | number
  }
  Dynamic?: {
    from?: string
  }
  DynamicDetail: {
    commentId: number | string
    commentType: number
    images: { src: string; ratio: number }[]
    name: string
    mid: string | number
    text: string
  }
  Hot: {
    query: number
  }
  Follow: undefined
  About: undefined
}

export type GetFuncPromiseType<F extends (...a: any) => any> =
  ReturnType<F> extends Promise<infer R> ? R : never

import { NativeStackScreenProps } from '@react-navigation/native-stack'
export type NavigationProps = NativeStackScreenProps<RootStackParamList>
