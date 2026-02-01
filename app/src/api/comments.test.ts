import { assert, describe, test } from 'vitest'

import { CommentResponseSchema } from './comments.schema'
import fetcher from './fetcher'

describe('reply-list', () => {
  test('video-comment', async () => {
    const res = await fetcher<any>(
      '/x/v2/reply/wbi/main?oid=490300290&type=1',
      // 'https://api.bilibili.com/x/v2/reply/wbi/main?oid=490300290&type=1&mode=3&pagination_str=%7B%22offset%22:%22%7B%5C%22type%5C%22:1,%5C%22direction%5C%22:1,%5C%22session_id%5C%22:%5C%221747230614515773%5C%22,%5C%22data%5C%22:%7B%7D%7D%22%7D&plat=1&web_location=1315875&w_rid=154ee21628c4026eb397b14c3dbda3e2&wts=1706280981',
    )

    CommentResponseSchema.parse(res)
    assert.ok(res.replies.length > 10)
  })
  test('text-comment', async () => {
    const res = await fetcher('/x/v2/reply/wbi/main?oid=228138377&type=11')
    CommentResponseSchema.parse(res)
  })
})
