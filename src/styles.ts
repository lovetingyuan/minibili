import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'

import tailwindStyles from './style.tw.css'

// console.log('tailwindStyles', tailwindStyles)

const cache: Record<string, StyleProp<unknown>> = {}

function _s(classes: string | TemplateStringsArray): any {
  if (typeof classes !== 'string') {
    classes = classes[0]
  }
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
export const s = {
  i(classes: string | TemplateStringsArray) {
    return _s(classes) as StyleProp<ImageStyle>
  },
  t(classes: string | TemplateStringsArray) {
    return _s(classes) as StyleProp<TextStyle>
  },
  v(classes: string | TemplateStringsArray) {
    return _s(classes) as StyleProp<ViewStyle>
  },
}
