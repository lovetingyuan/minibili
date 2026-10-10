import { Platform, Text as NativeText } from 'react-native'
import type { TextStyle } from 'react-native'
import { theme } from '@/constants/colors.tw'
import useResolvedStyle from '@/hooks/useResolvedStyle'
import type { TextProps } from './Text.types'

const nativeTextBaseStyle = Platform.select<TextStyle>({
  android: {
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
  },
})

export function Text({ className, style, accessibilityRole = 'text', ...props }: TextProps) {
  const defaultColorStyle = useResolvedStyle(theme.text.primary)
  const resolvedStyle = useResolvedStyle(className)

  return (
    <NativeText
      {...props}
      accessibilityRole={accessibilityRole}
      style={[nativeTextBaseStyle, defaultColorStyle, style, resolvedStyle]}
    />
  )
}
