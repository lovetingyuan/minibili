export type RootStackParamList = {
  Home: undefined
  Main: undefined
  WebPage: { url: string; title: string; type?: 'pc' | 'mobile' }
  Play: {
    aid: number | string
    bvid: string
    name: string
    mid: string | number
  }
  Dynamic?: {
    from?: string
  }
  Hot: {
    query: number
  }
  Follow: undefined
  About: undefined
}

export type GetFuncPromiseType<F extends (...a: any) => any> =
  ReturnType<F> extends Promise<infer R> ? R : never

export interface UserInfo {
  mid: number | string
  name: string
  face: string
  sign: string
}

import { NativeStackScreenProps } from '@react-navigation/native-stack'
export type NavigationProps = NativeStackScreenProps<RootStackParamList>
