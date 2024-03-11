import { describe, expect, test } from 'vitest'

import fetcher from './fetcher'
import { LiveInfoBatchItemSchema } from './living-info.schema'

describe('living-info', () => {
  test('living-user', async () => {
    const uids = Array.from({ length: 250 }).map((v, i) => {
      return `uids[]=${1458143131 + i}`
    })
    const res = await fetcher<any>(
      'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?' +
        uids.join('&'),
    )
    expect('1458143131' in res).toBe(true)
    LiveInfoBatchItemSchema.parse(res['1458143131'])
    expect('1458143263' in res).toBe(true)
    LiveInfoBatchItemSchema.parse(res['1458143263'])
    expect(
      Object.keys(res).every(v => +v >= 1458143131 && +v < 1458143131 + 250),
    ).toBe(true)
  })
})
