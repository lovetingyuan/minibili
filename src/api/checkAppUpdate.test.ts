import { test, expect } from 'vitest'
import { changelogUrl } from '../constants'

test('check-update', async () => {
  const res = await fetch(changelogUrl).then(r => r.json())
  expect(res).toBeInstanceOf(Array)
  expect(res).toHaveLength(5)
})
