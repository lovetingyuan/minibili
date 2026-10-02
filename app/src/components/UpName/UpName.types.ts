import type { ComponentProps } from 'react'

import type { Text } from '@/components/Text'

export type UpNameProps = ComponentProps<typeof Text> & {
  mid: string | number | undefined
}
