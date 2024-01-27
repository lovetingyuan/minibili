import fetcher from './fetcher-test'
import { describe, test, assert } from 'vitest'
import { ReplyResponseSchema } from './comments.schema'
import encWbi from '../utils/wbi'

// https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0
const getUrl = async (params: any) => {
  const data: any = await fetcher(
    'https://api.bilibili.com/x/web-interface/nav',
  )
  const query = encWbi(params, data.wbi_img.img_url, data.wbi_img.sub_url)
  return `https://api.bilibili.com/x/v2/reply/wbi/main?${query}`
}

describe('reply-list', () => {
  test('video-comment', async () => {
    const url = await getUrl({
      oid: 490300290,
      type: 1,
    })

    const res = await fetcher<any>(
      url,
      // 'https://api.bilibili.com/x/v2/reply/wbi/main?oid=490300290&type=1&mode=3&pagination_str=%7B%22offset%22:%22%7B%5C%22type%5C%22:1,%5C%22direction%5C%22:1,%5C%22session_id%5C%22:%5C%221747230614515773%5C%22,%5C%22data%5C%22:%7B%7D%7D%22%7D&plat=1&web_location=1315875&w_rid=154ee21628c4026eb397b14c3dbda3e2&wts=1706280981',
    )

    ReplyResponseSchema.parse(res)
    assert.ok(res.replies.length > 10)
  })
  test('text-comment', async () => {
    const url = await getUrl({
      oid: 228138377,
      type: 11,
    })
    const res = await fetcher(
      url,
      // 'https://api.bilibili.com/x/v2/reply/main?oid=228138377&type=11',
    )
    ReplyResponseSchema.parse(res)
  })
})
