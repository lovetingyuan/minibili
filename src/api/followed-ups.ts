import fetcher from './fetcher'
// import useSWRImmutable from 'swr/immutable'
import { z } from 'zod'
import {
  FollowedUpDataResponseSchema,
  FollowedUpResponseSchema,
} from './followed-ups.schema'
import store from '../store'

type FollowedUpResponse = z.infer<typeof FollowedUpResponseSchema>

const getFollowedUp = (up: FollowedUpResponse) => {
  return {
    face: up.face,
    mid: up.mid,
    name: up.uname,
    sign: up.sign,
  }
}
export type FollowedUpItem = ReturnType<typeof getFollowedUp>

type Res = z.infer<typeof FollowedUpDataResponseSchema>

// const fetcher2 = async (url: string) => {
//   const data = await fetcher<Res>(url)
//   const total = data.total
//   const list = [data.list]
//   // 系统限制最多访问前五页
//   const pageCount = Math.ceil(total / 50) - 1
//   const pages = Math.min(pageCount, 4)
//   await Promise.all(
//     Array.from({ length: pages }).map((v, i) => {
//       return fetcher<Res>(url.replace('pn=1', 'pn=' + (i + 2))).then(res => {
//         list[i + 1] = res.list
//       })
//     }),
//   )
//   return {
//     total,
//     list: list.flat().map(getFollowedUp),
//   }
// }

// // https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=50&order=desc&jsonp=jsonp
// export function useFollowedUps(mid?: string | number) {
//   // const { $followedUps } = useStore()
//   const { data, error, isLoading } = useSWRImmutable(
//     mid
//       ? `/x/relation/followings?vmid=${mid}&pn=1&ps=50&order=desc&jsonp=jsonp`
//       : null,
//     fetcher2,
//   )
//   // if (data?.list.length && !error && !isLoading) {
//   //   store.$followedUps = data.list
//   // }
//   return {
//     data,
//     error,
//     // isValidating,
//     isLoading,
//   }
// }

// https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=50&order=desc&jsonp=jsonp
export function getFollowedUps(mid: string | number) {
  // const { $followedUps } = useStore()
  const url = `/x/relation/followings?vmid=${mid}&pn=1&ps=50&order=desc&jsonp=jsonp`
  let totalNum = 0
  if (!mid) {
    return Promise.resolve(0)
  }
  const upList: Res['list'][] = []
  return fetcher<Res>(url)
    .then(data => {
      totalNum = data.total
      upList.push(data.list)
      return data
    })
    .then(() => {
      const pageCount = Math.ceil(totalNum / 50) - 1
      const pages = Math.min(pageCount, 4)
      return Promise.all(
        Array.from({ length: pages }).map((v, i) => {
          return fetcher<Res>(url.replace('pn=1', 'pn=' + (i + 2))).then(
            res => {
              upList[i + 1] = res.list
            },
          )
        }),
      )
    })
    .then(() => {
      store.$followedUps = upList.flat().map(getFollowedUp)
      return totalNum
    })
}
