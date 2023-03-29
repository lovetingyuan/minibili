import fetcher from './fetcher-test'
import { test } from 'vitest'
import { UserRelationResponseSchema } from './user-relation.schema'

test('user-relation', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/relation/stat?vmid=14427395',
  )
  UserRelationResponseSchema.parse(res)
})
