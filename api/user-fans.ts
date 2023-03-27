import useSWR from 'swr'
import { z } from 'zod'
import { parseNumber } from '../utils'
import fetcher from './fetcher'
import { UserFansResponseSchema } from './user-fans.schema'

export function useUserFans(mid?: number | string) {
  // const blackUps = await getBlackUps;
  const { data, mutate, error, isValidating, isLoading } =
    useSWR<UserFansResponse>(
      () => {
        return `/x/relation/stat?vmid=${mid}`
      },
      (url: string) => {
        if (!mid) {
          return Promise.reject(new Error('IGNORE'))
        }
        return fetcher(url)
      },
    )

  return {
    data: typeof data?.follower === 'number' ? parseNumber(data.follower) : '',
    mutate,
    error,
    isValidating,
    isLoading,
  }
}
export type UserFansResponse = z.infer<typeof UserFansResponseSchema>
