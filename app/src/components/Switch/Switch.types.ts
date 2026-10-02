import type { SwitchProps as NativeSwitchProps } from 'react-native'

export type SwitchProps = NativeSwitchProps & {
  colorClassName?: string
  iosBackgroundColorClassName?: string
  trackColorOnClassName?: string
  trackColorOffClassName?: string
}
