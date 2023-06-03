import fetcher from './fetcher-test'
import { describe, test } from 'vitest'
import { DynamicListResponseSchema } from './dynamic-items.schema'
// import fs from 'node:fs'

const ups = [1458143131, 14427395]

describe('dynamic-list', () => {
  ups.forEach(mid => {
    test('up: ' + mid, async () => {
      const res = await fetcher<any>(
        `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`,
      )
      const offset = res.offset
      DynamicListResponseSchema.parse(res)
      const res2 = await fetcher(
        // https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=14427395&timezone_offset=-480
        `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=${offset}&host_mid=${mid}&timezone_offset=-480`,
      )
      DynamicListResponseSchema.parse(res2)
    })
  })
})
