import useSWR from 'swr'

import { parseUrl } from '../utils'
import request from './fetcher'
import type { SearchResponse } from './search-up.schema'

export const useSearchUps = (name: string) => {
  const { data, error, isValidating } = useSWR<SearchResponse>(
    name
      ? `/x/web-interface/wbi/search/type?keyword=${encodeURIComponent(name)}&page=1&page_size=50&platform=pc&search_type=bili_user`
      : null,
    request,
    {
      dedupingInterval: 30 * 1000,
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
