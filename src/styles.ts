import { StyleProp, StyleSheet } from 'react-native'

const commonStyles = StyleSheet.create(
  /** start */
  {
    flex1: {
      flex: 1,
    },
    bold: { fontWeight: 'bold' },
    font16: {
      fontSize: 16,
    },
    font12: {
      fontSize: 12,
    },
    font13: {
      fontSize: 13,
    },
    font14: {
      fontSize: 14,
    },
    font15: {
      fontSize: 15,
    },
    font18: {
      fontSize: 18,
    },
    font20: {
      fontSize: 20,
    },
    gap2: {
      gap: 2,
    },
  },
  /** end */
)

const cache: Record<string, StyleProp<unknown>> = {}

export function s(classes: string) {
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
