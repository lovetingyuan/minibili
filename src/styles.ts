import {
  // ImageStyle,
  type StyleProp,
  // StyleSheet,
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
  const classList = classes.split(' ')
  const styles = classList.map(c => {
    const ret = tailwindStyles[c]
    if (!ret) {
      throw new Error(`class ${c} does not exist in generated tailwindStyles`)
    }
    return ret
  })

  // @ts-ignore
  // const r = StyleSheet.compose(...styles)
  // console.log(33, classList, styles, r)

  cache[classes] = styles
  return styles
}

// @ts-ignore
window.tw = tw

function tw(classes: string, style: any) {
  if (!classes) {
    return null
  }
  const twStyles = _s(classes)
  // console.log(classes, twStyle)
  if (!style) {
    return twStyles
  }
  if (Array.isArray(style)) {
    return [...twStyles, ...style]
  }
  return [...twStyles, style]
}

// export { tw }
