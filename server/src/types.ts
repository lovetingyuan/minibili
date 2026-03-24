import type { Context, Hono } from 'hono'

export const SYNC_TO_SERVER_KEYS = [
  '$blackUps',
  '$followedUps',
  '$blackTags',
  '$videoCatesList',
  '$collectedVideos',
  '$watchedVideos',
  '$musicList',
] as const

export type SyncToServerKey = (typeof SYNC_TO_SERVER_KEYS)[number]

export type SyncSetPayload = Partial<Record<SyncToServerKey, unknown>>

export interface SyncOperations {
  delete?: SyncToServerKey[]
  get?: SyncToServerKey[]
  set?: SyncSetPayload
}

export type AuthFailureReason = 'expired' | 'invalid'

export interface AssetsBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

export interface UserStorageStub {
  canSendOtp(): Promise<{ canSend: boolean; waitSeconds: number }>
  clearAuthState(): Promise<void>
  clearOtpState(): Promise<void>
  issueToken(): Promise<{ expiresAt: number; token: string }>
  rotateToken(): Promise<{ expiresAt: number; token: string }>
  saveOtp(otp: string): Promise<void>
  syncData(operations: SyncOperations): Promise<Partial<Record<SyncToServerKey, unknown>>>
  verifyOtp(otp: string): Promise<{ reason?: 'exhausted' | 'expired' | 'invalid'; valid: boolean }>
  verifyToken(token: string): Promise<{ reason?: AuthFailureReason; valid: boolean }>
}

export interface UserStorageNamespace {
  get(id: DurableObjectId | string): UserStorageStub
  idFromName(name: string): DurableObjectId | string
}

export interface ServerBindings {
  ASSETS: AssetsBinding
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  USER_STORAGE: UserStorageNamespace
}

export type AppType = Hono<{ Bindings: ServerBindings }>
export type AppContext = Context<{ Bindings: ServerBindings }>
