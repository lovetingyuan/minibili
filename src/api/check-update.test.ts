import { test, expect, describe } from 'vitest'
import { changelogUrl } from '../constants'
import { z } from 'zod'

describe('app-version-update', () => {
  test('version.json', async () => {
    const BuildListSchema = z
      .object({
        version: z.string(),
        changelog: z.string().array(),
        date: z.string(),
      })
      .array()
    const res = await fetch(changelogUrl).then(r => r.json())
    expect(res.length > 0).toBe(true)
    BuildListSchema.parse(res)
  }, 10000)
  test.skip(
    'unpkg-check',
    async () => {
      await fetch('https://unpkg.com/minibili/package.json')
        .then(r => r.json())
        .then(pkg => {
          expect(typeof pkg.version).toBe('string')
          expect(typeof pkg.config.versionCode).toBe('number')
        })
    },
    {
      timeout: 60000,
    },
  )
})
