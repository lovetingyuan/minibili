import { test } from 'vitest'

import request from './fetcher'
import { getWBIInfo } from './user-nav'
import ResSchema from './user-nav.schema'

test('get-user-nav', async () => {
  const res = await getWBIInfo(request)
  ResSchema.parse({
    isLogin: false,
    wbi_img: res,
  })
})
