import fetcher from './fetcher-test'
import { describe, test } from 'vitest'
import { SearchResponseSchema, SearchUpItemSchema } from './search-up.schema'
import encWbi from '../utils/wbi'

// https://api.bilibili.com/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=X&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0
const url = async (word: string) => {
  const data: any = await fetcher(
    'https://api.bilibili.com/x/web-interface/nav',
  )
  const query = encWbi(
    {
      page: 1,
      page_size: 50,
      platform: 'pc',
      keyword: word,
      search_type: 'bili_user',
    },
    data.wbi_img.img_url,
    data.wbi_img.sub_url,
  )
  return `https://api.bilibili.com/x/web-interface/wbi/search/type?${query}`
}

describe('search ups', () => {
  test('search-ups-X', async () => {
    const res: any = await fetcher(await url('X'))
    SearchResponseSchema.parse(res)
    SearchUpItemSchema.parse(res.result[0])
    SearchUpItemSchema.parse(res.result[10])
  })
  test('search-ups-super-long', async () => {
    const res = await fetcher(
      await url(
        'dnsfjkldsfklsdnklsdjfksdlfjskldfjsdklfjkdflasjdakldjalsdjkjnvxcnncklsnfklajdlk',
      ),
    )
    SearchResponseSchema.parse(res)
  })
  test('search-ups-special-chars', async () => {
    const res = await fetcher(await url('这我是第三方😊忽视对方i hi哦'))
    SearchResponseSchema.parse(res)
  })
})
