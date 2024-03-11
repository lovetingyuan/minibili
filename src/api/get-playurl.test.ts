import { test } from 'vitest'

import request from './fetcher'
import { PlayUrlResponseSchema } from './get-playurl.schema'

test('get-play-url', async () => {
  const res = await request(
    '/x/player/wbi/playurl?bvid=BV1Av421r7Ur&cid=1454646853&type=mp4&qn=64&fnval=1&platform=pc&high_quality=1',
  )
  PlayUrlResponseSchema.parse(res)
})

test('get-play-url-2', async () => {
  const res = await request(
    '/x/player/wbi/playurl?bvid=BV1SZ421y7Ae&cid=1460675026&type=mp4&qn=64&platform=pc&high_quality=1',
  )
  PlayUrlResponseSchema.parse(res)
})

test('get-play-url-html5', async () => {
  const res = await request(
    '/x/player/wbi/playurl?bvid=BV1Av421r7Ur&cid=1454646853&type=mp4&qn=64&fnval=1&platform=html5&high_quality=1',
  )
  PlayUrlResponseSchema.parse(res)
})
