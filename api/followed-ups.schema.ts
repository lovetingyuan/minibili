import { z } from 'zod'

export const FollowedUpResponseSchema = z.object({
  face: z.string(),
  mid: z.union([z.number(), z.string()]),
  mtime: z.number(),
  // official_verify: { type: number; desc: string }
  sign: z.string(),
  // special: 0;
  // tag: null
  uname: z.string(),
})

export const FollowedUpDataResponseSchema = z.object({
  total: z.number(),
  list: FollowedUpResponseSchema.array(),
})

// type Res = { total: number; list: FollowedUpResponse[] }

// // https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=50&order=desc&jsonp=jsonp
// export function useFollowedUps(mid?: string | number) {
//   const { data, error, isValidating, isLoading } = useSWR(
//     `/x/relation/followings?vmid=${mid}&pn=1&ps=50&order=desc&jsonp=jsonp`,
//     fetcher2,
//   )
//   return {
//     data,
//     error,
//     isValidating,
//     isLoading,
//   }
// }
