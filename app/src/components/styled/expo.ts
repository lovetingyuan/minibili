import React from "react";
import { Image as BaseImage } from 'expo-image'
import { withUniwind } from 'uniwind'

type StyledImageProps = React.ComponentProps<typeof BaseImage> & {
  className?: string
  tintColorClassName?: string
}

export const Image = withUniwind(BaseImage) as unknown as React.ComponentType<StyledImageProps>
