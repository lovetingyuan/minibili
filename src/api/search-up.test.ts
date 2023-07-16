import fetcher from './fetcher-test'
import { describe, test } from 'vitest'
import { SearchResponseSchema } from './search-up.schema'

// https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0
const url = (word: string) => {
  return `https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=50&platform=pc&keyword=${encodeURIComponent(
    word,
  )}&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0`
}

describe('search ups', () => {
  test('search-ups-X', async () => {
    const res = await fetcher(url('X'))
    SearchResponseSchema.parse(res)
  })
  test('search-ups-zkjaskdjkaldsad', async () => {
    const res = await fetcher(url('zkjaskdjkaldsad'))
    SearchResponseSchema.parse(res)
  })
  test('search-ups-这我是第三方', async () => {
    const res = await fetcher(url('这我是第三方'))
    SearchResponseSchema.parse(res)
  })
})
