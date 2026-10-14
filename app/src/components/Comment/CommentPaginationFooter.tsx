import { View } from 'react-native'

import { theme } from '@/constants/colors.tw'
import { Text } from '@/components/Text'
import { LoadErrorText } from '@/components/LoadErrorText'

import type { CommentPaginationFooterProps } from './comment-pagination-footer.types'

export default function CommentPaginationFooter(props: CommentPaginationFooterProps) {
  return (
    <View className="h-12 items-center justify-center">
      {props.hasItems ? (
        props.isValidating ? (
          <Text className={`text-xs ${theme.text.muted}`}>正在加载...</Text>
        ) : props.error ? (
          <LoadErrorText className="py-3 text-xs" onRetry={props.onRetry} />
        ) : (
          <Text className={`text-xs ${theme.text.muted}`}>
            {props.isPageEnd ? `没有更多${props.noun}了` : '上拉加载更多'}
          </Text>
        )
      ) : null}
    </View>
  )
}
