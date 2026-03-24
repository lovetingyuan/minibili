import * as authApi from '@/api/auth'
import { getStoreMethods } from '@/store'
import { clearAuthData, clearAuthToken, getAuthData, setAuthData } from '@/utils/secure-store'

import { normalizeAuthEmail } from './helpers'
import type { AuthFailureReason, AuthModalMode } from './types'

function setAuthModalState(
  mode: AuthModalMode,
  visible: boolean,
  reason: AuthFailureReason | null,
) {
  const methods = getStoreMethods()
  methods.setAuthModalMode(mode)
  methods.setAuthModalVisible(visible)
  methods.setAuthFailureReason(reason)
}

export function closeAuthModal() {
  const methods = getStoreMethods()
  methods.setAuthModalVisible(false)
}

export function openAuthModal(mode: AuthModalMode, reason: AuthFailureReason | null = null) {
  setAuthModalState(mode, true, reason)
}

export function setAnonymousAuthState() {
  const methods = getStoreMethods()
  methods.setAuthReady(true)
  methods.setAuthEmail(null)
  methods.setIsAuthenticated(false)
  setAuthModalState('login', false, null)
}

export async function setAuthenticatedAuthState(email: string, token: string) {
  const normalizedEmail = normalizeAuthEmail(email)
  await setAuthData(normalizedEmail, token)

  const methods = getStoreMethods()
  methods.setAuthReady(true)
  methods.setAuthEmail(normalizedEmail)
  methods.setIsAuthenticated(true)
  setAuthModalState('login', false, null)
}

export function setNetworkUnavailableAuthState(email: string | null) {
  const methods = getStoreMethods()
  methods.setAuthReady(true)
  methods.setAuthEmail(email ? normalizeAuthEmail(email) : null)
  methods.setIsAuthenticated(false)
  methods.setAuthModalVisible(false)
  methods.setAuthModalMode(email ? 'reauth' : 'login')
  methods.setAuthFailureReason('network')
}

export async function setReauthenticationRequiredState(
  email: string,
  reason: Exclude<AuthFailureReason, 'network'>,
  visible: boolean,
) {
  await clearAuthToken().catch(() => {})

  const methods = getStoreMethods()
  methods.setAuthReady(true)
  methods.setAuthEmail(normalizeAuthEmail(email))
  methods.setIsAuthenticated(false)
  setAuthModalState('reauth', visible, reason)
}

export async function logoutUser() {
  const { email, token } = await getAuthData()

  if (email && token) {
    await authApi.logout(email, token)
  }

  await clearAuthData().catch(() => {})
  setAnonymousAuthState()
}
