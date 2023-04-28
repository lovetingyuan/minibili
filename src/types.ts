import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicItem } from './api/dynamic-items'
import { DynamicTypeEnum } from './api/dynamic-items.schema'

export type RootStackParamList = {
  Home: undefined
  Main: undefined
  WebPage: { url: string; title?: string; type?: 'pc' | 'mobile' }
  Play?: {
    from?: 'dynamic'
  }
  Dynamic?: {
    from?: string
  }
  DynamicDetail: {
    detail: Extract<
      DynamicItem,
      | { type: DynamicTypeEnum.DYNAMIC_TYPE_DRAW }
      | {
          type: DynamicTypeEnum.DYNAMIC_TYPE_WORD
        }
    >
  }
  VideoList: {
    query: number
  }
  Follow: undefined
  About: undefined
}

export type GetFuncPromiseType<F extends (...a: any) => any> =
  ReturnType<F> extends Promise<infer R> ? R : never

export type NavigationProps = NativeStackScreenProps<RootStackParamList>
