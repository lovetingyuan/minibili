import { Text } from '@/components/Text'
import { theme } from '@/constants/colors.tw'
import type { LoadErrorTextProps } from './LoadErrorText.types'

export function LoadErrorText({
  message = '加载失败',
  disabled = false,
  onRetry,
  className = 'text-sm',
  colorClassName = theme.text.muted,
  retryClassName = theme.primary.text,
}: LoadErrorTextProps) {
  return (
    <Text accessible={false} className={`text-center ${colorClassName} ${className}`}>
      {message}，
      <Text
        accessible
        className={retryClassName}
        accessibilityRole="button"
        accessibilityLabel={`${message}，点击重试`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onRetry}
      >
        点击重试
      </Text>
    </Text>
  )
}
