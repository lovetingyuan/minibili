import fetcher from './fetcher-test'
import { describe, test } from 'vitest'
import { ReplyResponseSchema } from './dynamic-comments.schema'

describe('reply-list', () => {
  test('video-comment', async () => {
    const res = await fetcher(
      'https://api.bilibili.com/x/v2/reply/main?next=1&oid=691926664&type=1',
    )
    ReplyResponseSchema.parse(res)
  })
  test('text-comment', async () => {
    const res = await fetcher(
      'https://api.bilibili.com/x/v2/reply/main?next=1&oid=228138377&type=11',
    )
    ReplyResponseSchema.parse(res)
  })
})
