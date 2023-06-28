import fetcher from './fetcher-test'
import { test } from 'vitest'
import {
  UserBatchInfoResponseSchema,
  UserCardInfoResponseSchema,
} from './user-info.schema'

test('user-card-info', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/web-interface/card?mid=14427395',
  )
  UserCardInfoResponseSchema.parse(res)
})

test('user-batch-info', async () => {
  const res = await fetcher(
    'https://api.vc.bilibili.com/account/v1/user/cards?uids=14427395',
  )
  UserBatchInfoResponseSchema.parse(res)
})
