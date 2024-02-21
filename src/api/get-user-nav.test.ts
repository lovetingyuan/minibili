import { test } from 'vitest'

import request from './fetcher-test'
import ResSchema from './get-user-nav.schema'

test('get-user-nav', async () => {
  const res = await request('/x/web-interface/nav')
  ResSchema.parse(res)
})
