import { test } from 'vitest'

import fetcher from './fetcher'
import { VideoInfoResponseSchema } from './video-info.schema'

test('video-info', async () => {
  const res = await fetcher('/x/web-interface/view?aid=336141511')
  VideoInfoResponseSchema.parse(res)
})
