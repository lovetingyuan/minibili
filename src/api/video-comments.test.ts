import fetcher from './fetcher-test'
import { test } from 'vitest'
import { ReplyResponseSchema } from './video-comments.schema'

test('reply-list', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/v2/reply/main?next=1&oid=691926664&type=1',
  )
  ReplyResponseSchema.parse(res)
})
