import { INITIAL_LAYOUT_VALUE, KEYBOARD_STATUS, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

import { theme } from '@/constants/colors.tw'

import type { ReplySheetContentProps } from './reply-sheet-content.types'

export default function ReplySheetContent(props: ReplySheetContentProps) {
  const { animatedLayoutState, animatedPosition, animatedKeyboardState } = useBottomSheetInternal()
  const contentStyle = useAnimatedStyle(() => {
    const { containerHeight, handleHeight } = animatedLayoutState.get()
    if (containerHeight === INITIAL_LAYOUT_VALUE || handleHeight === INITIAL_LAYOUT_VALUE) {
      return { height: 0 }
    }

    const { status, heightWithinContainer } = animatedKeyboardState.get()
    const keyboardHeight = status === KEYBOARD_STATUS.SHOWN ? heightWithinContainer : 0

    // gorhom 的内容区按最大档位布局，回复区需要跟随当前可见高度，才能露出底部评论框。
    return {
      height: Math.max(0, containerHeight - animatedPosition.get() - handleHeight - keyboardHeight),
    }
  })

  return (
    <Animated.View
      className={`w-full shrink-0 overflow-hidden rounded-t-[28px] ${theme.background.surface}`}
      style={contentStyle}
    >
      {props.children}
    </Animated.View>
  )
}
