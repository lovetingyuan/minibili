import { assert, describe, test } from 'vitest'

import fetcher from './fetcher'
import { SearchResponseSchema, SearchUpItemSchema } from './search-up.schema'

// https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0
describe('search ups', () => {
  test('search-ups-X', async () => {
    const res: any = await fetcher(
      '/x/web-interface/wbi/search/type?page=1&page_size=50&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0',
    )
    SearchResponseSchema.parse(res)
    SearchUpItemSchema.parse(res.result[0])
    assert.ok(res.result.length === 50)
    SearchUpItemSchema.parse(res.result[10])
    const res2: any = await fetcher(
      '/x/web-interface/wbi/search/type?page=2&page_size=50&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0',
    )
    SearchResponseSchema.parse(res2)
    assert.ok(res2.result.length === 50)
    SearchUpItemSchema.parse(res2.result[0])
  })
  test('search-ups-super-long', async () => {
    const res = await fetcher(
      '/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=dfiefjisfjfadfhsjkfksdlfjksldfjdsfsdfs&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0',
    )
    SearchResponseSchema.parse(res)
  })
  test('search-ups-special-chars', async () => {
    const res = await fetcher(
      '/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=这是我的🌼xdd🐕&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0',
    )
    SearchResponseSchema.parse(res)
  })
})
