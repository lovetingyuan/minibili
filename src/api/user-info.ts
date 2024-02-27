import useSWRImmutable from 'swr/immutable'

import { useStore } from '../store'
// import fetcher from './fetcher'
// import { z } from 'zod'
// import {
//   UserBatchInfoResponseSchema,
//   UserCardInfoResponseSchema,
//   UserInfoResponseSchema,
// } from './user-info.schema'
import type { UpInfo } from '../types'

// type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>
type UserInfo = UpInfo & {
  level: number
  sex: string
  silence: 0 | 1
}

// type UserCardInfoResponse = z.infer<typeof UserCardInfoResponseSchema>
// type UserBatchInfoResponse = z.infer<typeof UserBatchInfoResponseSchema>

// const getUserInfo1 = (mid: number | string): Promise<UserInfo> => {
//   // TODO: /x/space/wbi/acc/info
//   return fetcher<UserInfoResponse>('/x/space/wbi/acc/info?mid=' + mid).then(
//     userInfo => {
//       return {
//         face: userInfo.face,
//         name: userInfo.name,
//         sign: userInfo.sign,
//         mid: userInfo.mid.toString(),
//         level: userInfo.level,
//         sex: userInfo.sex,
//       }
//     },
//   )
// }

// const getUserInfo2 = (mid: number | string): Promise<UserInfo> => {
//   return fetcher<UserCardInfoResponse>('/x/web-interface/card?mid=' + mid).then(
//     userInfo => {
//       return {
//         face: userInfo.card.face,
//         name: userInfo.card.name,
//         sign: userInfo.card.sign,
//         mid: userInfo.card.mid.toString(),
//         level: userInfo.card.level_info.current_level,
//         sex: userInfo.card.sex,
//       }
//     },
//   )
// }

// const getUserInfo3 = (mid: number | string): Promise<UserInfo> => {
//   return fetcher<UserBatchInfoResponse>(
//     'https://api.vc.bilibili.com/account/v1/user/cards?uids=' + mid,
//   ).then(data => {
//     const [userInfo] = data
//     return {
//       face: userInfo.face,
//       name: userInfo.name,
//       sign: userInfo.sign,
//       mid: userInfo.mid.toString(),
//       level: userInfo.level,
//       sex: userInfo.sex,
//     }
//   })
// }

// const request = async (mid: number | string) => {
//   // const tasks = [getUserInfo2, getUserInfo3, getUserInfo1]
//   const tasks = [getUserInfo1]
//   for (let i = 0; i < tasks.length; i++) {
//     try {
//       return await tasks[i](mid)
//     } catch (error) {
//       if (i === tasks.length - 1) {
//         throw new Error('Failed to fetch user info of ' + mid)
//       }
//     }
//   }
// }

export function useUserInfo(mid?: number | string) {
  const { get$followedUps, set$followedUps } = useStore()
  const { data } = useSWRImmutable<UserInfo | undefined>(
    mid ? `/x/space/wbi/acc/info?mid=${mid}` : null,
    {
      onSuccess(_data) {
        if (!_data) {
          return
        }
        const followedUps = get$followedUps()
        const index = followedUps.findIndex(
          u => u.mid.toString() === _data.mid.toString(),
        )
        if (index === -1) {
          return
        }
        // 用户信息可能会变化
        const followedUp = followedUps[index]
        if (
          followedUp.name !== _data.name ||
          followedUp.sign !== _data.sign ||
          followedUp.face !== _data.face
        ) {
          followedUps[index] = {
            ...followedUp,
            name: _data.name,
            sign: _data.sign,
            face: _data.face,
          }
          set$followedUps(followedUps.slice())
        }
      },
    },
  )

  return {
    data,
  }
}
