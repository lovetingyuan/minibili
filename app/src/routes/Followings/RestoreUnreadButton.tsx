import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Undo2 } from 'lucide-react-native'
import React from 'react'

import { FAB } from '@/components/FAB'
import { ThemedIcon } from '@/components/ThemedIcon'
import { theme } from '@/constants/colors.tw'
import { bilibiliSession } from '@/features/bilibili-session/session'
import type { BilibiliAccount } from '@/features/bilibili-session/types'
import { useBilibiliSessionState } from '@/features/bilibili-session/useBilibiliSession'
import { useAppStateChange } from '@/hooks/useAppState'
import { getStoreMethods, useStore } from '@/store'
import { useMarkFollowingDynamicsUnread } from '@/store/actions'
import type { FollowingDynamicsUnreadRestore } from '@/store/following-dynamics-unread-restore.types'
import { getActiveFollowedUps, useActiveFollowedUps } from '@/store/followings'

const RESTORE_DURATION_MS = 5_000

function isAvailable(
  restore: FollowingDynamicsUnreadRestore,
  account: BilibiliAccount | null | undefined,
  followedUps = getActiveFollowedUps(),
) {
  return Boolean(
    account &&
      restore.accountMid === account.mid &&
      restore.generation === account.generation &&
      bilibiliSession.isCurrentAccount(account) &&
      followedUps.some(up => String(up.mid) === restore.upMid),
  )
}

function clearRestore(restore: FollowingDynamicsUnreadRestore) {
  // 旧的计时器或导航事件不能清掉后来查看的 UP。
  getStoreMethods().setFollowingDynamicsUnreadRestore(current =>
    current === restore ? null : current,
  )
}

export default function RestoreUnreadButton() {
  const navigation = useNavigation()
  const focused = useIsFocused()
  const { account } = useBilibiliSessionState()
  const followedUps = useActiveFollowedUps()
  const { followingDynamicsUnreadRestore: restore } = useStore()
  const markUnread = useMarkFollowingDynamicsUnread()
  const available = Boolean(restore && isAvailable(restore, account, followedUps))

  React.useEffect(() => {
    const methods = getStoreMethods()
    const unsubscribeFocus = navigation.addListener('focus', () => {
      const current = methods.getFollowingDynamicsUnreadRestore()
      if (!current) {
        return
      }
      if (!isAvailable(current, account)) {
        clearRestore(current)
      } else if (current.expiresAt === null) {
        // 必须等实际返回关注页，不能在记录点击目标时提前计时。
        methods.setFollowingDynamicsUnreadRestore({
          ...current,
          expiresAt: Date.now() + RESTORE_DURATION_MS,
        })
      }
    })
    const unsubscribeBlur = navigation.addListener('blur', () => {
      const current = methods.getFollowingDynamicsUnreadRestore()
      if (current?.expiresAt != null) {
        clearRestore(current)
      }
    })
    return () => {
      unsubscribeFocus()
      unsubscribeBlur()
    }
  }, [account, navigation])

  React.useEffect(() => {
    if (!restore) {
      return
    }
    if (!available) {
      clearRestore(restore)
      return
    }
    if (restore.expiresAt === null) {
      return
    }
    const timer = setTimeout(() => clearRestore(restore), Math.max(0, restore.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [available, restore])

  React.useEffect(() => {
    return () => getStoreMethods().setFollowingDynamicsUnreadRestore(null)
  }, [])

  useAppStateChange(state => {
    if (state === 'active' && restore?.expiresAt != null && Date.now() >= restore.expiresAt) {
      clearRestore(restore)
    }
  })

  function restoreUnread() {
    if (!restore) {
      return
    }
    if (
      getStoreMethods().getFollowingDynamicsUnreadRestore() === restore &&
      navigation.isFocused() &&
      restore.expiresAt !== null &&
      Date.now() < restore.expiresAt &&
      isAvailable(restore, account)
    ) {
      markUnread(restore.upMid)
    }
    clearRestore(restore)
  }

  return (
    <FAB
      accessibilityLabel={restore ? `恢复${restore.name}的未读状态` : '恢复未读'}
      visible={focused && available && restore?.expiresAt != null}
      size="small"
      placement="right"
      hitSlop={4}
      onPress={restoreUnread}
      icon={<ThemedIcon icon={Undo2} size={20} colorClassName={theme.mediaBadge.accent} />}
    />
  )
}
