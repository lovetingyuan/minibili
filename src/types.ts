import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicItem } from './api/dynamic-items'
import { HandledDynamicTypeEnum } from './api/dynamic-items.type'

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
      | { type: HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW }
      | {
          type: HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD
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
