import { test } from 'vitest'

import fetcher from './fetcher-test'
import { UserRelationResponseSchema } from './user-relation.schema'

test('user-relation', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/relation/stat?vmid=1458143131',
  )
  UserRelationResponseSchema.parse(res)
})
