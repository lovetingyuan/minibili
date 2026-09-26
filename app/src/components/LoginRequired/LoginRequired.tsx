import { View } from 'react-native'

import { Button, Text } from '@/components/styled/rneui'
import { theme } from '@/constants/theme'
import { openBilibiliLogin } from '@/routes/navigation'

import type { LoginRequiredProps } from './LoginRequired.types'

export function LoginRequired({
  actionText = '登录 B站',
  description,
  message = '需要登录B站查看',
}: LoginRequiredProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      <Text className="text-center text-lg font-semibold">{message}</Text>
      {description ? (
        <Text className={`text-center text-sm ${theme.text.muted}`}>{description}</Text>
      ) : null}
      <Button title={actionText} onPress={openBilibiliLogin} />
    </View>
  )
}
