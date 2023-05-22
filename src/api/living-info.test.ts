import fetcher from './fetcher-test'
import { test, describe, expect } from 'vitest'
import {
  // LiveRoomInfoResponseSchema,
  // LiveInfoResponseSchema,
  // LiveUserInfoResponseSchema,
  LiveInfoBatchItemSchema,
} from './living-info.schema'

describe('living-info', () => {
  // test('live-user', async () => {
  //   const res = await fetcher(
  //     'https://api.live.bilibili.com/live_user/v1/Master/info?uid=14427395',
  //   )
  //   LiveRoomInfoResponseSchema.parse(res)
  // })
  // test('live-info', async () => {
  //   const res = await fetcher(
  //     'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=21762353',
  //   )
  //   LiveInfoResponseSchema.parse(res)
  // })
  // test('live-user-info', async () => {
  //   const res = await fetcher(
  //     'https://api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web',
  //   )
  //   LiveUserInfoResponseSchema.parse(res)
  // })
  test('living-user', async () => {
    const uids = Array.from({ length: 250 })
      .map((v, i) => {
        return `uids[]=${14427395 + i}`
      })
      .concat(['uids[]=672328094', 'uids[]=322892'])
    const res = await fetcher<any>(
      'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?' +
        uids.join('&'),
    )
    expect('672328094' in res).toBe(true)
    LiveInfoBatchItemSchema.parse(res['672328094'])
    delete res['672328094']
    expect('322892' in res).toBe(true)
    LiveInfoBatchItemSchema.parse(res['322892'])
    delete res['322892']
    expect(
      Object.keys(res).every(v => +v >= 14427395 && +v < 14427395 + 250),
    ).toBe(true)
  })
})
