import { test } from 'vitest'

import fetcher from './fetcher'
import {
  // UserBatchInfoResponseSchema,
  UserCardInfoResponseSchema,
  // UserInfoResponseSchema,
} from './user-info.schema'

// test('user-info', async () => {
//   const res = await fetcher('/x/space/wbi/acc/info?mid=3493117728656046')
//   UserInfoResponseSchema.parse(res)
// })

test('user-card-info', async () => {
  const res = await fetcher('/x/web-interface/card?mid=1458143131')
  UserCardInfoResponseSchema.parse(res)
})

// test('user-batch-info', async () => {
//   const res = await fetcher(
//     'https://api.vc.bilibili.com/account/v1/user/cards?uids=1458143131',
//   )
//   UserBatchInfoResponseSchema.parse(res)
// })
