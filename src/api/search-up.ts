import useSWR from 'swr'
import { SearchResponse } from './search-up.schema'
import { parseUrl } from '../utils'
import request from './fetcher'

export const useSearchUps = (name: string) => {
  const keyword = encodeURIComponent(name)
  const { data, error, isValidating } = useSWR<SearchResponse>(
    name
      ? `/x/web-interface/wbi/search/type?page=1&page_size=36&platform=pc&keyword=${keyword}&search_type=bili_user&order_sort=0&user_type=0&dynamic_offset=0`
      : null,
    request,
    {
      dedupingInterval: 1000,
    },
  )
  return {
    data: data?.result?.map(up => {
      return {
        name: up.uname,
        face: parseUrl(up.upic),
        sign: up.usign,
        mid: up.mid,
        fans: up.fans,
      }
    }),
    error,
    isValidating,
  }
}

export type SearchedUpType = Exclude<
  ReturnType<typeof useSearchUps>['data'],
  undefined
>[0]
