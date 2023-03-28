import useSWR from 'swr'
import fetcher from './fetcher'
import { z } from 'zod'
import { UserInfoResponseSchema } from './user-info.schema'

const getUserInfo = (userInfo: UserInfoResponse) => {
  return {
    face: userInfo.face,
    name: userInfo.name,
    sign: userInfo.sign,
    mid: userInfo.mid,
    level: userInfo.level,
    sex: userInfo.sex,
  }
}

export function useUserInfo(mid?: number | string) {
  const { data, error, isValidating, isLoading } = useSWR<UserInfoResponse>(
    () => {
      if (!mid) {
        return null
      }
      return '/x/space/acc/info?mid=' + mid + '&token=&platform=web&jsonp=jsonp'
    },
    (url: string) => {
      return fetcher<UserInfoResponse>(url, 'https://space.bilibili.com/')
    },
  )
  return {
    data: !error && data ? getUserInfo(data) : null,
    isValidating,
    isLoading,
    error,
  }
}

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>

export type UserInfo = ReturnType<typeof getUserInfo>
