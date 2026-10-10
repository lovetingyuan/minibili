import { useUserSettings } from '@/features/user-data/useUserSettings'
import { Text } from '@/components/Text'
import { theme } from '@/constants/colors.tw'

export default function SettingsSync() {
  const { error } = useUserSettings()
  if (!error) {
    return null
  }

  return (
    <Text className={`text-sm ${theme.error.text}`} accessibilityRole="alert">
      设置保存暂时失败
    </Text>
  )
}
