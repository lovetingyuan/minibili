import { useNavigation } from '@react-navigation/native'
import { clsx } from 'clsx'
import { Alert, View } from 'react-native'

import { Avatar } from '@/components/Avatar'
import { getDynamicUpTarget } from '@/components/dynamic/dynamic-target'
import { Button, Text } from '@/components/styled/rneui'
import { theme } from '@/constants/theme'
import { useBilibiliSession } from '@/features/bilibili-session/useBilibiliSession'
import { openBilibiliLogin } from '@/routes/navigation'
import type { MainTabNavigationProp } from '@/types'
import { getImagePixelSize, parseImgUrl, parseNumber, showToast } from '@/utils'

export const headerRight = () => <AuthButton />
export const headerTitle = () => <MineHeaderTitle />

function AuthButton() {
  const { account, control, isChecking, logout } = useBilibiliSession()
  const loggingOut = control.phase === 'logging-out'

  async function handleLogout() {
    try {
      await logout()
      showToast('已退出登录')
    } catch {
      showToast('退出登录失败，请重试；B站数据和云端设置未删除')
    }
  }

  function onPress() {
    if (isChecking || loggingOut) {
      showToast('正在确认登录状态，请稍候重试')
      return
    }
    if (!account) {
      openBilibiliLogin()
      return
    }
    Alert.alert('退出登录', '退出登录后某些功能会不可用，您可以随时再次通过B站账号登录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          void handleLogout()
        },
      },
    ])
  }

  return (
    <Button
      type="clear"
      size="sm"
      containerClassName="mr-2"
      loading={isChecking || loggingOut}
      onPress={onPress}
    >
      {account ? '退出' : '登录'}
    </Button>
  )
}

function MineHeaderTitle() {
  const { account } = useBilibiliSession()
  const navigation = useNavigation<MainTabNavigationProp>()

  if (!account) {
    return (
      <Text className={clsx(theme.text.primary, 'text-lg')} numberOfLines={1}>
        我的
      </Text>
    )
  }

  const { face, follower, mid, name } = account.profile
  const spaceLabel = `查看 ${name} 的主页`

  function openUpSpace() {
    navigation.navigate('Dynamic', getDynamicUpTarget({ mid, name, face }))
  }

  return (
    <View className="flex-row items-center">
      <Avatar
        accessibilityLabel={spaceLabel}
        onPress={openUpSpace}
        rounded
        size={36}
        source={{
          uri: parseImgUrl(face, getImagePixelSize(36)),
        }}
      />
      <View className="ml-2 shrink flex-row items-baseline">
        <Text
          accessibilityLabel={spaceLabel}
          accessibilityRole="button"
          className={clsx(theme.primary.text, 'shrink text-lg')}
          numberOfLines={1}
          onPress={openUpSpace}
        >
          {name}
        </Text>
        {follower != null ? (
          <Text className={clsx(theme.text.muted, 'ml-2 shrink-0 text-sm')} numberOfLines={1}>
            {parseNumber(follower)}粉丝
          </Text>
        ) : null}
      </View>
    </View>
  )
}
