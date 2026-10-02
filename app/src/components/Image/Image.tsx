import type { ComponentType } from 'react'
import { Image as BaseImage } from 'expo-image'
import { withUniwind } from 'uniwind'
import type { StyledImageProps } from './Image.types'

export const Image = withUniwind(BaseImage) as unknown as ComponentType<StyledImageProps>
