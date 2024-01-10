import useSWR from 'swr'
import { SearchResponse } from './search-up.schema'
import { parseUrl } from '../utils'
import request from './fetcher'
import { useWbiQuery } from './get-wbi'

export const useSearchUps = (name: string) => {
  const query = useWbiQuery(
    name
      ? {
          keyword: name,
          page: 1,
          page_size: 50,
          platform: 'pc',
          search_type: 'bili_user',
        }
      : null,
  )
  const { data, error, isValidating } = useSWR<SearchResponse>(
    query ? `/x/web-interface/wbi/search/type?${query}` : null,
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
