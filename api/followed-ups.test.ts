import fetcher from './fetcher-test'
import { test } from 'vitest'
import { FollowedUpDataResponseSchema } from './followed-ups.schema'

test('followed-ups', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=10&order=desc&jsonp=jsonp',
  )
  FollowedUpDataResponseSchema.parse(res)
})
