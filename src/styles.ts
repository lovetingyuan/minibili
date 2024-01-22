import {
  // ImageStyle,
  StyleProp,
  StyleSheet,
  // TextStyle,
  // ViewStyle,
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

// @ts-ignore
window.tw = function tw(classes: string, style: any) {
  if (!classes) {
    return null
  }
  const twStyle = _s(classes)
  if (!style) {
    return twStyle
  }
  if (Array.isArray(style)) {
    return [twStyle, ...style]
  }
  return [twStyle, style]
}
