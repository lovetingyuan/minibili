import { z } from 'zod'

export const HotVideoResponseSchema = z.object({
  aid: z.number(),
  bvid: z.string(),
  cid: z.number(),
  copyright: z.number(),
  ctime: z.number(),
  desc: z.string(),
  dimension: z.object({
    width: z.number(),
    height: z.number(),
    rotate: z.number(),
  }),
  duration: z.number(),
  dynamic: z.string(),
  first_frame: z.string(),
  is_ogv: z.boolean(),
  // ogv_info: z.null(),
  owner: z.object({ mid: z.number(), name: z.string(), face: z.string() }),
  pic: z.string(),
  pubdate: z.number(),
  // rcmd_reason: z.object({content: '百万播放', corner_mark: 0}),
  // rights: z.object({bp: 0, elec: 0, download: 0, movie: 0, pay: 0, …}),
  // season_type: 0
  short_link: z.string(),
  short_link_v2: z.string(),
  stat: z.object({
    aid: z.number(),
    view: z.number(),
    danmaku: z.number(),
    favorite: z.number(),
    his_rank: z.number(),
    like: z.number(),
    now_rank: z.number(),
    reply: z.number(),
    share: z.number(),
  }),
  state: z.number(),
  tid: z.number(),
  title: z.string(),
  tname: z.string(),
  videos: z.number(),
})

export const HotVideosDataResponseSchema = z.object({
  list: HotVideoResponseSchema.array(),
  no_more: z.boolean(),
})
