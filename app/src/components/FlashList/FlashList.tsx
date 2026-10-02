import React from 'react'
import { FlashList as BaseFlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import useResolvedStyle from '@/hooks/useResolvedStyle'
import type { FlashListComponent, StyledFlashListProps } from './FlashList.types'

const FlashListBase = React.forwardRef(function FlashListInner<T>(
  {
    className,
    contentContainerClassName,
    ListFooterComponentClassName,
    ListHeaderComponentClassName,
    style,
    contentContainerStyle,
    ListFooterComponentStyle,
    ListHeaderComponentStyle,
    ...props
  }: StyledFlashListProps<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  const resolvedStyle = useResolvedStyle(className)
  const resolvedContentContainerStyle = useResolvedStyle(contentContainerClassName)
  const resolvedFooterStyle = useResolvedStyle(ListFooterComponentClassName)
  const resolvedHeaderStyle = useResolvedStyle(ListHeaderComponentClassName)

  return (
    <BaseFlashList
      {...props}
      ref={ref}
      style={{ ...style, ...resolvedStyle }}
      contentContainerStyle={[contentContainerStyle, resolvedContentContainerStyle]}
      ListFooterComponentStyle={[ListFooterComponentStyle, resolvedFooterStyle]}
      ListHeaderComponentStyle={[ListHeaderComponentStyle, resolvedHeaderStyle]}
    />
  )
}) as FlashListComponent

export const FlashList = FlashListBase
