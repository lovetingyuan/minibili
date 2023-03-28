import fetcher from './fetcher-test'
import { test } from 'vitest'
import { VideoInfoResponseSchema } from './video-info.schema'

test('video-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/web-interface/view?aid=336141511',
  )
  VideoInfoResponseSchema.parse(res)
})
