import { test } from 'vitest'

import request from './fetcher'
import { ReplyResponseSchema } from './replies.schema'

test('get-comment-replies-1', async () => {
  const repliesInfo = {
    oid: 1451532147,
    root: 212143555808,
    type: 1,
  }
  const res = await request(
    `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${1}&ps=20`,
  )
  ReplyResponseSchema.parse(res)
})

test('get-comment-replies-2', async () => {
  const repliesInfo = {
    oid: 1201343439,
    root: 211238435904,
    type: 1,
  }
  const res = await request(
    `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${2}&ps=20`,
  )
  ReplyResponseSchema.parse(res)
})
