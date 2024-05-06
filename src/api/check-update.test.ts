import { describe, expect, test } from 'vitest'
import { z } from 'zod'

describe('app-version-update', () => {
  test(
    'version.json',
    {
      timeout: 60000,
    },
    async () => {
      const res = await fetch(
        'https://unpkg.com/minibili/docs/version.json',
      ).then((r) => r.json())
      expect(res.length > 0).toBe(true)
      z.object({
        version: z.string(),
        changelog: z.string().array(),
        date: z.string(),
      })
        .array()
        .parse(res)
    },
  )

  test(
    'unpkg-check',
    {
      timeout: 60000,
    },
    async () => {
      await fetch('https://unpkg.com/minibili/package.json')
        .then((r) => r.json())
        .then((pkg) => {
          expect(typeof pkg.version).toBe('string')
          expect(typeof pkg.config.versionCode).toBe('number')
        })
    },
  )
})
