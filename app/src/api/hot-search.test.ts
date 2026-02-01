import { test } from 'vitest'

import request from './fetcher'
import { HotSearchSchema } from './hot-search.schema'

test('get-hot-search', async () => {
  const data = await request(
    'https://app.bilibili.com/x/v2/search/trending/ranking',
  )
  HotSearchSchema.parse(data)
})
