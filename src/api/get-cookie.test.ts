import { test, assert } from 'vitest'
import { getCookie } from './get-cookie'

test('get-cookie', async () => {
  const res = await getCookie()
  assert(/buvid3=(.+); _uuid=(.+); buvid4=(.+)/.test(res))
})
