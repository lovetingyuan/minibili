import type { TextProps as NativeTextProps } from 'react-native'

export type TextProps = NativeTextProps & {
  className?: string
}
