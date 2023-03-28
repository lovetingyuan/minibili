import fetcher from './fetcher-test'
import { test } from 'vitest'
import { UserFansResponseSchema } from './user-fans.schema'

test('user-fans', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/relation/stat?vmid=14427395',
  )
  UserFansResponseSchema.parse(res)
})
