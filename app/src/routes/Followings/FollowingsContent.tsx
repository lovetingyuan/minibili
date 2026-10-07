import { ActivityIndicator, View } from 'react-native'

import { LoginRequired } from '@/components/LoginRequired'
import { Button } from '@/components/Button'
import { Text } from '@/components/Text'
import { useFollowingsState } from '@/features/bilibili-followings/useFollowingsState'
import { isLoginRequiredError } from '@/features/bilibili-session/login-required'
import FollowList from './FollowList'

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
          <>
            <Text className="text-center">B站关注列表同步失败，尚未显示旧的本地记录</Text>
            <Button title="重新同步" loading={isValidating} onPress={retry} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text>正在同步 B站关注列表</Text>
          </>
        )}
      </View>
    )
  }
  return <FollowList />
}
