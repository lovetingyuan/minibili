// https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=36&platform=&keyword=%E4%BD%A0%E5%9D%A4%E5%93%A5&search_type=video
import { assert, describe, test } from 'vitest'

import fetcher from './fetcher'
import {
  SearchVideoItemSchema,
  SearchVideoResponseSchema,
} from './search-video.schema'

describe('search videos', () => {
  test('search-videos-X', async () => {
    const res: any = await fetcher(
      '/x/web-interface/wbi/search/type?page=1&page_size=50&platform=pc&keyword=X&search_type=video',
    )
    SearchVideoResponseSchema.parse(res)
    SearchVideoItemSchema.parse(res.result[0])
    assert.ok(res.result.length === 50)
    SearchVideoItemSchema.parse(res.result[10])
    const res2: any = await fetcher(
      '/x/web-interface/wbi/search/type?page=2&page_size=50&platform=pc&keyword=X&search_type=video',
    )
    SearchVideoResponseSchema.parse(res2)
    assert.ok(res2.result.length === 50)
    SearchVideoItemSchema.parse(res2.result[10])
  })
  // test('search-ups-super-long', async () => {
  //   const res = await fetcher(
  //     '/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=dfiefjisfjfadfhsjkfksdlfjksldfjdsfsdfs&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0',
  //   )
  //   SearchUpResponseSchema.parse(res)
  // })
  test('search-videos-special-chars', async () => {
    const res = await fetcher(
      '/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=这是我的🌼xdd🐕&search_type=video',
    )
    SearchVideoResponseSchema.parse(res)
  })
})
