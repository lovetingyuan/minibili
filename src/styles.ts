import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'

const commonStyles = StyleSheet.create(
  /** start */
  {
    'mt-4': {
      marginTop: 16,
    },
    'mt-7': {
      marginTop: 28,
    },
    'aspect-square': {
      aspectRatio: 1,
    },
    'flex-1': {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '0%',
    },
    'gap-2': {
      gap: 8,
    },
    'self-center': {
      alignSelf: 'center',
    },
    'text-\\[17px\\]': {
      fontSize: 17,
    },
    'text-base': {
      fontSize: 16,
      lineHeight: 24,
    },
    'text-sm': {
      fontSize: 14,
      lineHeight: 20,
    },
    'font-bold': {
      fontWeight: '700',
    },
  },
  /** end */
)

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
  const classList = classes.split(' ') as (keyof typeof commonStyles)[]
  const styles = classList.map(c => commonStyles[c])
  // @ts-ignore
  const r = StyleSheet.compose(...styles)
  cache[classes] = r
  return r
}
