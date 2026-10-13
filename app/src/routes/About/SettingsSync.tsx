import { useEffect } from 'react'
import { useSWRConfig } from 'swr'

import { bilibiliSession } from '@/features/bilibili-session/session'
import { useBilibiliSessionState } from '@/features/bilibili-session/useBilibiliSession'
import { useUserSettings } from '@/features/user-data/useUserSettings'
import { useScreenFocusRefresh } from '@/hooks/useScreenFocusRefresh'
import { Text } from '@/components/Text'
import { theme } from '@/constants/colors.tw'

export default function SettingsSync() {
  const { error, ready } = useUserSettings()
  const { account } = useBilibiliSessionState()
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (ready && account && bilibiliSession.isCurrentAccount(account)) {
      void mutate(['user-data', account.mid, account.generation]).catch(() => {})
    }
  }, [account, ready, mutate])

  useScreenFocusRefresh(() => {
    if (ready && account && bilibiliSession.isCurrentAccount(account)) {
      return mutate(['user-data', account.mid, account.generation])
    }
  })

  if (!error) {
    return null
  }

  return (
    <Text className={`text-sm ${theme.error.text}`} accessibilityRole="alert">
      设置保存暂时失败
    </Text>
  )
}
