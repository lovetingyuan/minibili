import { z } from 'zod'

export const SearchUpItemSchema = z.object({
  type: z.string(),
  mid: z.number(),
  uname: z.string(),
  usign: z.string(),
  fans: z.number(),
  videos: z.number(),
  upic: z.string(),
  level: z.number(),
  gender: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  is_upuser: z.union([z.literal(0), z.literal(1)]),
  is_live: z.union([z.literal(0), z.literal(1)]),
  room_id: z.number(),
})

export const SearchResponseSchema = z.object({
  // seid: z.string(),
  page: z.number(),
  pagesize: z.number(),
  numResults: z.number(),
  numPages: z.number(),
  result: SearchUpItemSchema.array().nullish(),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>
export type SearchUpResType = z.infer<typeof SearchUpItemSchema>
