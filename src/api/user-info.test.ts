import fetcher from './fetcher-test'
import { test } from 'vitest'
import {
  UserCardInfoResponseSchema,
  UserInfoResponseSchema,
} from './user-info.schema'

test.skip('user-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/space/acc/info?mid=14427395&token=&platform=web&jsonp=jsonp',
  )
  UserInfoResponseSchema.parse(res)
})

test('user-card-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/web-interface/card?mid=14427395',
  )
  UserCardInfoResponseSchema.parse(res)
})
