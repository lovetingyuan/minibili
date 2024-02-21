import { test } from 'vitest'

import fetcher from './fetcher-test'
import { HotVideosDataResponseSchema } from './hot-videos.schema'

test('hot-videos', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1',
  )
  HotVideosDataResponseSchema.parse(res)
})
