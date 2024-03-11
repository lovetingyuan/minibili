import { test } from 'vitest'

import { getUserNav } from './get-user-nav'
import ResSchema from './get-user-nav.schema'

test('get-user-nav', async () => {
  const res = await getUserNav()
  ResSchema.parse(res)
})
