import useSWR from 'swr'
import { z } from 'zod'
import { parseNumber } from '../utils'
import { UserFansResponseSchema } from './user-fans.schema'

export function useUserFans(mid?: number | string) {
  // const blackUps = await getBlackUps;
  const { data, mutate, error, isValidating, isLoading } =
    useSWR<UserFansResponse>(mid ? `/x/relation/stat?vmid=${mid}` : null)

  return {
    data: typeof data?.follower === 'number' ? parseNumber(data.follower) : '',
    mutate,
    error,
    isValidating,
    isLoading,
  }
}
export type UserFansResponse = z.infer<typeof UserFansResponseSchema>
