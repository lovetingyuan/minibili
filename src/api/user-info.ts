import useSWRImmutable from 'swr/immutable'
import fetcher from './fetcher'
import { z } from 'zod'
import { UserInfoResponseSchema } from './user-info.schema'

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>
export type UserInfo = ReturnType<typeof getUserInfo>

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
  const { data, error, isValidating, isLoading } =
    useSWRImmutable<UserInfoResponse>(
      mid
        ? `/x/space/acc/info?mid=${mid}&token=&platform=web&jsonp=jsonp`
        : null,
      (url: string) => {
        return fetcher<UserInfoResponse>(url, 'https://space.bilibili.com/')
      },
    )
  return {
    data: data?.mid ? getUserInfo(data) : null,
    isValidating,
    isLoading,
    error,
  }
}
