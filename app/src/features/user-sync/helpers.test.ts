import { describe, expect, test } from 'vitest'

import { normalizeAuthEmail, normalizeOtpInput, resolveInitialSync } from './helpers'

describe('user-sync helpers', () => {
  test('normalizes email to lowercase', () => {
    expect(normalizeAuthEmail('  USER@Example.COM ')).toBe('user@example.com')
  })

  test('normalizes otp input to uppercase alphanumeric', () => {
    expect(normalizeOtpInput('ab-c123*xyz')).toBe('ABC123')
  })

  test('pushes local snapshot when remote is empty', () => {
    const resolution = resolveInitialSync(
      ['a', 'b'] as const,
      { a: 1, b: 2 },
      {},
      { a: 0, b: 0 },
    )

    expect(resolution).toEqual({
      hasRemoteData: false,
      nextLocal: { a: 1, b: 2 },
      nextRemoteSet: { a: 1, b: 2 },
    })
  })

  test('prefers remote snapshot and backfills missing defaults', () => {
    const resolution = resolveInitialSync(
      ['a', 'b', 'c'] as const,
      { a: 1, b: 2, c: 3 },
      { a: 9, c: 8 },
      { a: 0, b: 0, c: 0 },
    )

    expect(resolution).toEqual({
      hasRemoteData: true,
      nextLocal: { a: 9, b: 0, c: 8 },
      nextRemoteSet: { b: 0 },
    })
  })
})
