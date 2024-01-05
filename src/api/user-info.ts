import useSWRImmutable from 'swr/immutable'
import fetcher from './fetcher'
import { z } from 'zod'
import {
  UserBatchInfoResponseSchema,
  UserCardInfoResponseSchema,
  UserInfoResponseSchema,
} from './user-info.schema'
import { UpInfo } from '../types'
// import store from '../store'
import React from 'react'
import { useStore } from '../store'

type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>
type UserInfo = UpInfo & {
  level: number
  sex: string
}

type UserCardInfoResponse = z.infer<typeof UserCardInfoResponseSchema>
type UserBatchInfoResponse = z.infer<typeof UserBatchInfoResponseSchema>

const getUserInfo1 = (mid: number | string): Promise<UserInfo> => {
  return fetcher<UserInfoResponse>('/x/space/acc/info?mid=' + mid).then(
    userInfo => {
      return {
        face: userInfo.face,
        name: userInfo.name,
        sign: userInfo.sign,
        mid: userInfo.mid.toString(),
        level: userInfo.level,
        sex: userInfo.sex,
      }
    },
  )
}

const getUserInfo2 = (mid: number | string): Promise<UserInfo> => {
  return fetcher<UserCardInfoResponse>('/x/web-interface/card?mid=' + mid).then(
    userInfo => {
      return {
        face: userInfo.card.face,
        name: userInfo.card.name,
        sign: userInfo.card.sign,
        mid: userInfo.card.mid.toString(),
        level: userInfo.card.level_info.current_level,
        sex: userInfo.card.sex,
      }
    },
  )
}

const getUserInfo3 = (mid: number | string): Promise<UserInfo> => {
  return fetcher<UserBatchInfoResponse>(
    'https://api.vc.bilibili.com/account/v1/user/cards?uids=' + mid,
  ).then(data => {
    const [userInfo] = data
    return {
      face: userInfo.face,
      name: userInfo.name,
      sign: userInfo.sign,
      mid: userInfo.mid.toString(),
      level: userInfo.level,
      sex: userInfo.sex,
    }
  })
}

const request = async (mid: number | string) => {
  const tasks = [getUserInfo2, getUserInfo3, getUserInfo1]
  for (let i = 0; i < tasks.length; i++) {
    try {
      return await tasks[i](mid)
    } catch (error) {
      if (i === tasks.length - 1) {
        throw new Error('Failed to fetch user info of ' + mid)
      }
    }
  }
}

export function useUserInfo(mid?: number | string) {
  const { data } = useSWRImmutable<UserInfo | undefined>(
    mid ? `/x/space/acc/info?mid=${mid}` : null,
    () => request(mid!),
  )
  const { get$followedUps, set$followedUps } = useStore()
  React.useEffect(() => {
    if (!data) {
      return
    }
    const followedUps = get$followedUps()
    const index = followedUps.findIndex(u => u.mid == data.mid)
    // 用户信息可能会变化
    if (index >= 0) {
      // const up = store.$followedUps[isFollowed]
      const followedUp = followedUps[index]
      if (
        followedUp.name !== data.name ||
        followedUp.sign !== data.sign ||
        followedUp.face !== data.face
      ) {
        followedUps[index] = {
          ...followedUp,
          name: data.name,
          sign: data.sign,
          face: data.face,
        }
        set$followedUps(followedUps.slice())
        // store.$followedUps[isFollowed] = {
        //   ...up,
        //   name: data.name,
        //   sign: data.sign,
        //   face: data.face,
        // }
      }
    }
  }, [data])
  return {
    data,
    // isValidating,
    // isLoading,
    // error,
  }
}
