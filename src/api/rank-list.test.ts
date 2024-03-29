import { describe, test } from 'vitest'

import fetcher from './fetcher'
import { RankVideosDataResponseSchema } from './rank-list.schema'

describe('ranks-videos', () => {
  test('animation-videos', async () => {
    const res = await fetcher('/x/web-interface/ranking/v2?rid=1&type=all')
    RankVideosDataResponseSchema.parse(res)
  })
  test('music-videos', async () => {
    const res = await fetcher('/x/web-interface/ranking/v2?rid=3&type=all')
    RankVideosDataResponseSchema.parse(res)
  })
  test('all-videos', async () => {
    const res = await fetcher('/x/web-interface/ranking/v2?rid=0&type=all')
    RankVideosDataResponseSchema.parse(res)
  })
})
