import fetcher from './fetcher'
import { test } from 'vitest'
import {
  UserBatchInfoResponseSchema,
  UserCardInfoResponseSchema,
  UserInfoResponseSchema,
} from './user-info.schema'

test('user-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/space/wbi/acc/info?mid=1458143131',
  )
  UserInfoResponseSchema.parse(res)
})

test('user-card-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/web-interface/card?mid=1458143131',
  )
  UserCardInfoResponseSchema.parse(res)
})

test('user-batch-info', async () => {
  const res = await fetcher(
    'https://api.vc.bilibili.com/account/v1/user/cards?uids=1458143131',
  )
  UserBatchInfoResponseSchema.parse(res)
})
