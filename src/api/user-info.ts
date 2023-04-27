// import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
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
    living: userInfo.live_room?.liveStatus === 1,
    liveUrl: userInfo.live_room?.url,
  }
}

export function useUserInfo(mid?: number | string) {
  const { data, error, isValidating, isLoading } = useSWR<UserInfoResponse>(
    mid ? `/x/space/acc/info?mid=${mid}&token=&platform=web&jsonp=jsonp` : null,
    (url: string) => {
      return fetcher<UserInfoResponse>(url, 'https://space.bilibili.com/')
    },
    {
      refreshInterval: 10 * 60 * 1000,
    },
  )
  return {
    data: data?.mid ? getUserInfo(data) : null,
    isValidating,
    isLoading,
    error,
  }
}
