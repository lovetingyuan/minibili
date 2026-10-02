import type { ReactElement, Ref } from 'react'
import type { FlashListProps, FlashListRef } from '@shopify/flash-list'

export type StyledFlashListProps<T> = FlashListProps<T> & {
  className?: string
  contentContainerClassName?: string
  ListFooterComponentClassName?: string
  ListHeaderComponentClassName?: string
}

export type FlashListComponent = <T>(
  props: StyledFlashListProps<T> & { ref?: Ref<FlashListRef<T>> },
) => ReactElement

export type { FlashListRef }
