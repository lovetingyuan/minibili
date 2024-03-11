import { test } from 'vitest'

import fetcher from './fetcher'
import { HotVideosDataResponseSchema } from './hot-videos.schema'

test('hot-videos', async () => {
  const res = await fetcher('/x/web-interface/popular?ps=30&pn=1')
  HotVideosDataResponseSchema.parse(res)
})
