import useSWR from 'swr'
// import { parseNumber } from '../utils'
import fetcher from './fetcher'
import { z } from 'zod'
import { UserInfoResponseSchema } from './user-info.schema'

const getUserInfo = (
  userInfo: UserInfoResponse,
  // userFans?: UserFansResponse,
) => {
  return {
    // living: !!userInfo.live_room?.liveStatus,
    // liveUrl: userInfo.live_room?.url,
    face: userInfo.face,
    name: userInfo.name,
    sign: userInfo.sign,
    mid: userInfo.mid,
    level: userInfo.level,
    sex: userInfo.sex,
  }
}

export function useUserInfo(mid?: number | string) {
  // const blackUps = await getBlackUps;
  const { data, error, isValidating, isLoading } = useSWR<UserInfoResponse>(
    () => {
      return '/x/space/acc/info?mid=' + mid + '&token=&platform=web&jsonp=jsonp'
    },
    (url: string) => {
      if (!mid) {
        return Promise.reject(new Error('IGNORE'))
      }
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
