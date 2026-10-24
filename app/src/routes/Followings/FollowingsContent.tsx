import { ActivityIndicator, View } from 'react-native'

import { LoginRequired } from '@/components/LoginRequired'
import { LoadErrorText } from '@/components/LoadErrorText'
import { Text } from '@/components/Text'
import { useFollowingsState } from '@/features/bilibili-followings/useFollowingsState'
import { isLoginRequiredError } from '@/features/bilibili-session/login-required'
import FollowList from './FollowList'
import RestoreUnreadButton from './RestoreUnreadButton'

export default function FollowingsContent() {
  const { isReady, error, isValidating, mutate } = useFollowingsState()
  function retry() {
    void mutate().catch(() => {})
  }
  if (!isReady && isLoginRequiredError(error)) {
    return <LoginRequired description="登录后即可同步 B站关注列表" />
  }
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {error ? (
          <LoadErrorText disabled={isValidating} onRetry={retry} />
        ) : (
          <>
            <ActivityIndicator />
            <Text>正在同步 B站关注列表</Text>
          </>
        )}
      </View>
    )
  }
  return (
    <View className="flex-1">
      <FollowList />
      <RestoreUnreadButton />
    </View>
  )
}
