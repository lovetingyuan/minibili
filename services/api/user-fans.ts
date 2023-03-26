import useSWR from 'swr'
import { parseNumber } from '../../utils'
import fetcher from './fetcher'

// const fetcher2 = (url: string) => {
//   __DEV__ && console.log('fetch user info: ' + url)
//   return fetcher<UserFansResponse>(url, 'https://space.bilibili.com/')
// }

// https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1

export function useUserFans(mid?: number | string) {
  // const blackUps = await getBlackUps;
  const { data, mutate, error, isValidating, isLoading } =
    useSWR<UserFansResponse>(() => {
      return `/x/relation/stat?vmid=${mid}`
    }, fetcher)

  return {
    data: typeof data?.follower === 'number' ? parseNumber(data.follower) : '',
    mutate,
    error,
    isValidating,
    isLoading,
  }
}

export interface UserFansResponse {
  mid: number
  following: number
  whisper: number
  black: number
  follower: number
}
