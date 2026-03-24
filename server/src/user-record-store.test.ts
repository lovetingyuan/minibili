import { describe, expect, test, vi } from 'vitest'

import {
  MemoryStorageAdapter,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_RETRY_LIMIT,
  TOKEN_EXPIRY_MS,
  UserRecordStore,
} from './user-record-store'

describe('UserRecordStore', () => {
  test('saves and verifies otp successfully', async () => {
    const store = new UserRecordStore(new MemoryStorageAdapter())

    await store.saveOtp('ABC123')

    await expect(store.verifyOtp('ABC123')).resolves.toEqual({ valid: true })
    await expect(store.verifyOtp('ABC123')).resolves.toEqual({ reason: 'invalid', valid: false })
  })

  test('expires otp after five minutes', async () => {
    const adapter = new MemoryStorageAdapter()
    const store = new UserRecordStore(adapter)

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T00:00:00.000Z'))
    await store.saveOtp('ABC123')

    vi.advanceTimersByTime(OTP_EXPIRY_MS + 1)

    await expect(store.verifyOtp('ABC123')).resolves.toEqual({ reason: 'expired', valid: false })
    vi.useRealTimers()
  })

  test('enforces otp resend cooldown', async () => {
    const store = new UserRecordStore(new MemoryStorageAdapter())

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T00:00:00.000Z'))
    await store.saveOtp('ABC123')

    await expect(store.canSendOtp()).resolves.toEqual({
      canSend: false,
      waitSeconds: 60,
    })

    vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS)

    await expect(store.canSendOtp()).resolves.toEqual({
      canSend: true,
      waitSeconds: 0,
    })
    vi.useRealTimers()
  })

  test('invalidates otp after five failed attempts', async () => {
    const store = new UserRecordStore(new MemoryStorageAdapter())

    await store.saveOtp('ABC123')

    for (let attempt = 1; attempt < OTP_RETRY_LIMIT; attempt += 1) {
      await expect(store.verifyOtp('ZZZ999')).resolves.toEqual({ reason: 'invalid', valid: false })
    }

    await expect(store.verifyOtp('ZZZ999')).resolves.toEqual({ reason: 'exhausted', valid: false })
    await expect(store.verifyOtp('ABC123')).resolves.toEqual({ reason: 'invalid', valid: false })
  })

  test('issues and verifies tokens', async () => {
    const store = new UserRecordStore(new MemoryStorageAdapter())

    const issued = await store.issueToken()
    await expect(store.verifyToken(issued.token)).resolves.toEqual({ valid: true })

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + TOKEN_EXPIRY_MS + 1)
    await expect(store.verifyToken(issued.token)).resolves.toEqual({ reason: 'expired', valid: false })
    vi.useRealTimers()
  })

  test('rejects unsupported sync keys', async () => {
    const store = new UserRecordStore(new MemoryStorageAdapter())

    await expect(
      store.syncData({
        set: {
          $followedUps: [],
          $unknown: true,
        } as never,
      }),
    ).rejects.toThrow('Unsupported sync keys')
  })
})
