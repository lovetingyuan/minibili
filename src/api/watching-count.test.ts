import { test } from 'vitest'

import fetcher from './fetcher-test'
import { WatchingCountResponseSchema } from './watching-count.schema'

test('video-watching-count', async () => {
  const res = await fetcher(
    '/x/player/online/total?bvid=BV1j4411W7F7&cid=94198756',
  )
  WatchingCountResponseSchema.parse(res)
})
