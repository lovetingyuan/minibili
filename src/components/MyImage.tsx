import React from 'react'
import { Image, useWindowDimensions } from 'react-native'
import type { ImageProps } from 'react-native'

export default function MyImage(props: ImageProps & { widthScale?: number }) {
  const { width } = useWindowDimensions()
  const { source, widthScale = 0.9, ...otherProps } = props
  const [ratio, setRatio] = React.useState<number>(1)
  React.useEffect(() => {
    if (typeof source === 'object' && source && 'uri' in source && source.uri) {
      Image.getSize(source.uri, (w, h) => {
        setRatio(w / h)
      })
    } else {
      const imageSize = Image.resolveAssetSource(source)
      setRatio(imageSize.width / imageSize.height)
    }
  }, [source])
  return (
    <Image
      source={source}
      style={[
        {
          width: width * widthScale,
          height: 'auto',
          aspectRatio: ratio,
        },
        props.style,
      ]}
      {...otherProps}
    />
  )
}
