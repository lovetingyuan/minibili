import fetcher from './fetcher-test'
import { test, describe } from 'vitest'
import {
  LiveUserInfoResponseSchema,
  LiveInfoResponseSchema,
} from './living-info.schema'

describe('living-info', () => {
  test('live-user', async () => {
    const res = await fetcher(
      'https://api.live.bilibili.com/live_user/v1/Master/info?uid=14427395',
    )
    LiveUserInfoResponseSchema.parse(res)
  })
  test('live-info', async () => {
    const res = await fetcher(
      'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=21762353',
    )
    LiveInfoResponseSchema.parse(res)
  })
})
