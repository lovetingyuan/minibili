import { test } from 'vitest'

import fetcher from './fetcher'
import { VideoInfoResponseSchema } from './video-info.schema'

// https://api.bilibili.com/x/web-interface/view?bvid=BV1pG4y1s7ER

test('video-info', async () => {
  const res = await fetcher('/x/web-interface/view?aid=336141511')
  VideoInfoResponseSchema.parse(res)
})
