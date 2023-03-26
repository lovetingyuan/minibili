import useSWR from 'swr'
import { parseNumber } from '../../utils'
import fetcher from './fetcher'

const getUserInfo = (
  userInfo: UserInfoResponse,
  userFans?: UserFansResponse,
) => {
  return {
    living: !!userInfo.live_room?.liveStatus,
    liveUrl: userInfo.live_room?.url,
    face: userInfo.face,
    name: userInfo.name,
    sign: userInfo.sign,
    mid: userInfo.mid,
    level: userInfo.level,
    sex: userInfo.sex,
    fans:
      typeof userFans?.follower === 'number'
        ? parseNumber(userFans.follower)
        : '',
  }
}
// https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1

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
  const { data: data2 } = useSWR<UserFansResponse>(
    () => {
      return `/x/relation/stat?vmid=${mid}`
    },
    (url: string) => {
      if (!mid) {
        return Promise.reject(new Error('IGNORE'))
      }
      return fetcher<UserFansResponse>(url)
    },
  )

  return {
    data: !error && data ? getUserInfo(data, data2) : null,
    isValidating,
    isLoading,
    error,
  }
}

export interface UserInfoResponse {
  birthday: string
  coins: number
  face: string
  level: number
  live_room: {
    cover: string
    liveStatus: 0 | 1
    roomStatus: 1 | 0
    roomid: number
    title: string
    url: string
  } | null
  mid: number
  name: string
  sex: string
  sign: string
  top_photo: string
}

export interface UserFansResponse {
  mid: number
  following: number
  whisper: number
  black: number
  follower: number
}

export type UserInfo = ReturnType<typeof getUserInfo>
