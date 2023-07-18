import useSWRImmutable from 'swr/immutable'
import fetcher from './fetcher'
import { z } from 'zod'
import {
  UserBatchInfoResponseSchema,
  UserCardInfoResponseSchema,
  UserInfoResponseSchema,
} from './user-info.schema'
import { UpInfo } from '../types'
import store from '../store'
import React from 'react'

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
  const { data, error, isValidating, isLoading } = useSWRImmutable<
    UserInfo | undefined
  >(mid ? `/x/space/acc/info?mid=${mid}` : null, () => request(mid!))
  React.useEffect(() => {
    if (!data) {
      return
    }
    const isFollowed = store.$followedUps.findIndex(up => {
      return up.mid == data.mid
    })
    // 用户信息可能会变化
    if (isFollowed >= 0) {
      const up = store.$followedUps[isFollowed]
      if (up.name !== data.name) {
        up.name = data.name
      }
      if (up.sign !== data.sign) {
        up.sign = data.sign
      }
      if (up.face !== data.face) {
        up.face = data.face
      }
    }
  }, [data])
  return {
    data,
    isValidating,
    isLoading,
    error,
  }
}
