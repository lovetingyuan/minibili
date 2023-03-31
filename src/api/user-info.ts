import useSWRImmutable from 'swr/immutable'
import fetcher from './fetcher'
import { z } from 'zod'
import {
  UserInfoResponseSchema,
  // UserRelationResponseSchema,
} from './user-info.schema'
export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>
// export type UserRelationResponse = z.infer<typeof UserRelationResponseSchema>
export type UserInfo = ReturnType<typeof getUserInfo>

const getUserInfo = (
  userInfo: UserInfoResponse,
  // relation: UserRelationResponse,
) => {
  return {
    face: userInfo.face,
    name: userInfo.name,
    sign: userInfo.sign,
    mid: userInfo.mid,
    level: userInfo.level,
    sex: userInfo.sex,
    // fans: relation.follower, // 粉丝数
    // following: relation.following, // 关注数
  }
}

// export function useUserRelation(mid?: number | string) {
//   const { data, error, isValidating, isLoading } = useSWR<UserRelationResponse>(
//     mid ? `/x/relation/stat?vmid=${mid}&jsonp=jsonp` : null,
//     fetcher,
//   )
//   return {
//     data,
//     isValidating,
//     isLoading,
//     error,
//   }
// }

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
  // const { data: relation } = useUserRelation(mid)
  return {
    data: data?.mid ? getUserInfo(data) : null,
    isValidating,
    isLoading,
    error,
  }
}
