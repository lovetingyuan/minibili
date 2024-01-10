import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'

import tailwindStyles from './style.tw.css'

const cache: Record<string, StyleProp<unknown>> = {}

export const s = {
  i(classes: string) {
    return _s(classes) as StyleProp<ImageStyle>
  },
  t(classes: string) {
    return _s(classes) as StyleProp<TextStyle>
  },
  v(classes: string) {
    return _s(classes) as StyleProp<ViewStyle>
  },
}

function _s(classes: string): any {
  if (classes in cache) {
    return cache[classes]
  }
  const classList = classes.split(' ') as (keyof typeof tailwindStyles)[]
  const styles = classList.map(c => tailwindStyles[c])
  // @ts-ignore
  const r = StyleSheet.compose(...styles)
  cache[classes] = r
  return r
}
