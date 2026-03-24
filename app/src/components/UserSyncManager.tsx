import React from 'react'

import * as authApi from '@/api/auth'
import { syncUserData } from '@/api/user-sync'
import {
  applySyncToServerSnapshot,
  getDefaultSyncToServerSnapshot,
  getStoreMethods,
  getSyncToServerSnapshot,
  isSyncToServerKey,
  normalizeSyncToServerValue,
  subscribeStore,
  SyncToServerKeys,
  type SyncToServerKey,
  type SyncToServerSnapshot,
  useStore,
} from '@/store'
import { getAuthData } from '@/utils/secure-store'
import { showToast } from '@/utils'

import AuthModal from './AuthModal'
import { resolveInitialSync } from '@/features/user-sync/helpers'
import {
  closeAuthModal,
  setAnonymousAuthState,
  setAuthenticatedAuthState,
  setNetworkUnavailableAuthState,
  setReauthenticationRequiredState,
} from '@/features/user-sync/session'

function forEachSyncToServerKey(callback: <K extends SyncToServerKey>(key: K) => void) {
  SyncToServerKeys.forEach(key => {
    callback(key)
  })
}

function setSyncSnapshotValue<K extends SyncToServerKey>(
  snapshot: Partial<SyncToServerSnapshot>,
  key: K,
  value: SyncToServerSnapshot[K],
) {
  snapshot[key] = value
}

export default function UserSyncManager() {
  const { authEmail, authFailureReason, authModalMode, authModalVisible, initialed, isAuthenticated } =
    useStore()

  const bootstrapStartedRef = React.useRef(false)
  const initialSyncCompletedRef = React.useRef(false)
  const isApplyingRemoteRef = React.useRef(false)
  const pendingKeysRef = React.useRef(new Set<SyncToServerKey>())
  const syncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAuthenticatedRef = React.useRef(isAuthenticated)

  isAuthenticatedRef.current = isAuthenticated

  React.useEffect(() => {
    if (!initialed || bootstrapStartedRef.current) {
      return
    }

    bootstrapStartedRef.current = true
    void bootstrapAuth()
  }, [initialed])

  React.useEffect(() => {
    if (!initialed) {
      return
    }

    const unsubscribe = subscribeStore(({ key }) => {
      if (
        !isAuthenticatedRef.current ||
        !initialSyncCompletedRef.current ||
        isApplyingRemoteRef.current ||
        !isSyncToServerKey(key)
      ) {
        return
      }

      pendingKeysRef.current.add(key)
      queueSync()
    })

    return () => {
      unsubscribe()
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [initialed])

  React.useEffect(() => {
    if (!isAuthenticated || !authEmail) {
      initialSyncCompletedRef.current = false
      pendingKeysRef.current.clear()
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
      return
    }

    if (initialSyncCompletedRef.current) {
      return
    }

    void performInitialSync(authEmail)
  }, [authEmail, isAuthenticated])

  async function bootstrapAuth() {
    const methods = getStoreMethods()
    methods.setAuthReady(false)

    const { email, token } = await getAuthData()
    if (!email) {
      setAnonymousAuthState()
      return
    }

    if (!token) {
      await setReauthenticationRequiredState(email, 'invalid', true)
      return
    }

    const statusResult = await authApi.checkAuthStatus(email, token)
    if (statusResult.success && statusResult.valid && statusResult.token) {
      await setAuthenticatedAuthState(email, statusResult.token)
      return
    }

    if (statusResult.reason === 'network') {
      showToast('无法连接服务器检查登录状态')
      setNetworkUnavailableAuthState(email)
      return
    }

    await setReauthenticationRequiredState(email, statusResult.reason ?? 'invalid', true)
  }

  async function performInitialSync(email: string) {
    const { token } = await getAuthData()
    if (!token) {
      return
    }

    const remoteResult = await syncUserData<Partial<Record<SyncToServerKey, unknown>>>(email, token, {
      get: [...SyncToServerKeys],
    })

    if (!remoteResult.success) {
      if (remoteResult.code === 'unauthorized') {
        await setReauthenticationRequiredState(email, 'invalid', true)
        return
      }

      showToast(remoteResult.error)
      initialSyncCompletedRef.current = true
      return
    }

    const localSnapshot = getSyncToServerSnapshot()
    const defaultSnapshot = getDefaultSyncToServerSnapshot()
    const remoteSnapshot: Partial<SyncToServerSnapshot> = {}

    forEachSyncToServerKey(key => {
      if (Object.prototype.hasOwnProperty.call(remoteResult.result, key)) {
        setSyncSnapshotValue(
          remoteSnapshot,
          key,
          normalizeSyncToServerValue(key, remoteResult.result[key]),
        )
      }
    })

    const resolution = resolveInitialSync(
      SyncToServerKeys,
      localSnapshot,
      remoteSnapshot,
      defaultSnapshot,
    )

    if (resolution.hasRemoteData) {
      isApplyingRemoteRef.current = true
      applySyncToServerSnapshot(resolution.nextLocal)
      isApplyingRemoteRef.current = false

      if (resolution.nextRemoteSet) {
        const backfillResult = await syncUserData(email, token, {
          set: resolution.nextRemoteSet,
        })
        if (!backfillResult.success) {
          if (backfillResult.code === 'unauthorized') {
            await setReauthenticationRequiredState(email, 'invalid', true)
            return
          }
          showToast(backfillResult.error)
        }
      }
    } else {
      const pushLocalResult = await syncUserData(email, token, {
        set: resolution.nextRemoteSet ?? localSnapshot,
      })
      if (!pushLocalResult.success) {
        if (pushLocalResult.code === 'unauthorized') {
          await setReauthenticationRequiredState(email, 'invalid', true)
          return
        }
        showToast(pushLocalResult.error)
      }
    }

    initialSyncCompletedRef.current = true
  }

  function queueSync() {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = setTimeout(() => {
      void flushPendingKeys()
    }, 2000)
  }

  async function flushPendingKeys() {
    if (!isAuthenticatedRef.current || pendingKeysRef.current.size === 0) {
      return
    }

    const { email, token } = await getAuthData()
    if (!email || !token) {
      return
    }

    const snapshot = getSyncToServerSnapshot()
    const nextSet: Partial<Record<SyncToServerKey, unknown>> = {}
    pendingKeysRef.current.forEach(key => {
      nextSet[key] = snapshot[key]
    })

    const result = await syncUserData(email, token, { set: nextSet })
    if (!result.success) {
      if (result.code === 'unauthorized') {
        await setReauthenticationRequiredState(email, 'invalid', true)
        return
      }
      showToast(result.error)
      return
    }

    pendingKeysRef.current.clear()
  }

  async function handleVerifyOtp(email: string, otp: string) {
    const result = await authApi.verifyOtp(email, otp)
    if (!result.success || !result.token) {
      return result
    }

    await setAuthenticatedAuthState(email, result.token)
    initialSyncCompletedRef.current = false
    return result
  }

  return (
    <AuthModal
      email={authEmail}
      failureReason={authFailureReason}
      mode={authModalMode}
      onClose={closeAuthModal}
      onSendOtp={authApi.sendOtp}
      onVerifyOtp={handleVerifyOtp}
      visible={authModalVisible}
    />
  )
}
