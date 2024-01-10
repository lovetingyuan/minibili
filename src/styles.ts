import { StyleProp, StyleSheet } from 'react-native'

const commonStyles = StyleSheet.create(
  /** start */
{
  "container": {
    "width": "100%"
  },
  "visible": {
    "visibility": "visible"
  },
  "fixed": {
    "position": "fixed"
  },
  "absolute": {
    "position": "absolute"
  },
  "relative": {
    "position": "relative"
  },
  "mt-7": {
    "marginTop": 28
  },
  "flex": {
    "display": "flex"
  },
  "hidden": {
    "display": "none"
  },
  "aspect-square": {
    "aspectRatio": 1
  },
  "flex-1": {
    "flexGrow": 1,
    "flexShrink": 1,
    "flexBasis": "0%"
  },
  "self-center": {
    "alignSelf": "center"
  },
  "rounded": {
    "borderRadius": 4
  },
  "text-\\[17px\\]": {
    "fontSize": 17
  },
  "italic": {
    "fontStyle": "italic"
  },
  "outline": {
    "outlineStyle": "solid"
  },
  "filter": {
    "filter": ""
  }
}
/** end */
)

const cache: Record<string, StyleProp<unknown>> = {}

export function s(classes: string): StyleProp<unknown> {
  if (classes in cache) {
    return cache[classes]
  }
  const classList = classes.split(' ') as (keyof typeof commonStyles)[]
  const styles = classList.map(c => commonStyles[c])
  // @ts-ignore
  const r = StyleSheet.compose(...styles)
  cache[classes] = r
  return r
}

export default commonStyles
