import { test } from 'vitest'

import { getUserNav } from './user-nav'
import ResSchema from './user-nav.schema'

test('get-user-nav', async () => {
  const res = await getUserNav()
  ResSchema.parse(res)
})
