import { Image as ExpoImage, type ImageProps } from 'expo-image'
import React from 'react'
import { StyleSheet } from 'react-native'

export default React.memo(Image2)

function Image2(
  props: ImageProps & {
    initWidth?: number
    initHeight?: number
    className?: string
  },
) {
  const [sourceInfo, setSourceInfo] = React.useState<
    Parameters<NonNullable<ImageProps['onLoad']>>[0]['source'] | null
  >(null)

  const style: ImageProps['style'] = React.useMemo(() => {
    const imgStyle = StyleSheet.flatten(props.style) || {}

    if (sourceInfo) {
      const aspectRatio =
        typeof imgStyle.aspectRatio === 'number'
          ? imgStyle.aspectRatio
          : sourceInfo.width / sourceInfo.height
      if (typeof imgStyle.width !== 'number') {
        if (typeof imgStyle.height === 'number') {
          imgStyle.width = imgStyle.height * aspectRatio
        } else {
          imgStyle.width = sourceInfo.width
          imgStyle.height = imgStyle.width / aspectRatio
        }
      } else if (typeof imgStyle.height !== 'number') {
        imgStyle.height = imgStyle.width / aspectRatio
      }
    }

    return {
      width: 1,
      height: 1,
      ...imgStyle,
      ...(!sourceInfo && typeof props.initWidth === 'number'
        ? { width: props.initWidth }
        : null),
      ...(!sourceInfo && typeof props.initHeight === 'number'
        ? { height: props.initHeight }
        : null),
    }
  }, [props.style, sourceInfo, props.initWidth, props.initHeight])
  const handleLoad: typeof props.onLoad = data => {
    props.onLoad?.(data)
    setSourceInfo(data.source)
  }
  return <ExpoImage {...props} style={style} onLoad={handleLoad} />
}
