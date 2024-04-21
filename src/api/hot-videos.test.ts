import { test } from 'vitest'

import fetcher from './fetcher'
import { HotVideosDataResponseSchema } from './hot-videos.schema'

// https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1
test('hot-videos', async () => {
  const res = await fetcher('/x/web-interface/popular?ps=30&pn=1')
  HotVideosDataResponseSchema.parse(res)
})
