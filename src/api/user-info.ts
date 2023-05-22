import useSWRImmutable from 'swr/immutable'
// import useSWR from 'swr'
import fetcher from './fetcher'
import { z } from 'zod'
import {
  UserCardInfoResponseSchema,
  UserInfoResponseSchema,
} from './user-info.schema'

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>
export type UserInfo = {
  face: string
  name: string
  sign: string
  mid: string | number
  level: number
  sex: string
}

export type UserCardInfoResponse = z.infer<typeof UserCardInfoResponseSchema>

const request = (mid: number | string) => {
  return fetcher<UserInfoResponse>(
    '/x/space/acc/info?mid=' + mid,
    'https://space.bilibili.com/',
  ).then(
    userInfo => {
      return {
        face: userInfo.face,
        name: userInfo.name,
        sign: userInfo.sign,
        mid: userInfo.mid.toString(),
        level: userInfo.level,
        sex: userInfo.sex,
      } as UserInfo
    },
    () => {
      return fetcher<UserCardInfoResponse>(
        '/x/web-interface/card?mid=' + mid,
      ).then(userInfo => {
        return {
          face: userInfo.card.face,
          name: userInfo.card.name,
          sign: userInfo.card.sign,
          mid: userInfo.card.mid.toString(),
          level: userInfo.card.level_info.current_level,
          sex: userInfo.card.sex,
        } as UserInfo
      })
    },
  )
}

export function useUserInfo(mid?: number | string) {
  const { data, error, isValidating, isLoading } = useSWRImmutable<UserInfo>(
    mid ? `/x/space/acc/info?mid=${mid}` : null,
    () => request(mid!),
  )
  return {
    data,
    isValidating,
    isLoading,
    error,
  }
}
