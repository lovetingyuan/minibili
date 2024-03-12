import { test } from 'vitest'

import request from './fetcher'
import getLocationSchema from './user-location.schema'

test('get-user-location', async () => {
  const data = await request('/x/web-interface/zone')
  getLocationSchema.parse(data)
})
