import type { ComponentProps } from 'react'
import type { Image as BaseImage } from 'expo-image'

export type StyledImageProps = ComponentProps<typeof BaseImage> & {
  className?: string
  tintColorClassName?: string
}
