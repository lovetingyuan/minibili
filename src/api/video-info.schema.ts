import { z } from 'zod'

export const VideoInfoResponseSchema = z.object({
  aid: z.union([z.string(), z.number()]),
  bvid: z.string(),
  cid: z.number(),
  copyright: z.number(),
  ctime: z.number(),
  desc: z.string(),
  // desc_v2: [{…}]
  dimension: z.object({
    width: z.number(),
    height: z.number(),
    rotate: z.number(),
  }),
  duration: z.number(),
  dynamic: z.string(),
  is_chargeable_season: z.boolean(),
  is_season_display: z.boolean(),
  is_story: z.boolean(),
  like_icon: z.string(),
  mission_id: z.number(),
  no_cache: z.boolean(),
  owner: z.object({ mid: z.number(), name: z.string(), face: z.string() }),
  rights: z.object({
    // bp: z.number(),
    // elec: z.number(),
    // download: z.number(),
    // movie: z.number(),
    // pay: z.number(),
    // hd5: z.number(),
    // no_reprint: z.number(),
    // autoplay: z.number(),
    // ugc_pay: z.number(),
    is_cooperation: z.union([z.literal(0), z.literal(1)]),
    // ugc_pay_preview: z.number(),
    // no_background: z.number(),
    // clean_mode: z.number(),
    is_stein_gate: z.union([z.literal(0), z.literal(1)]),
    is_360: z.union([z.literal(0), z.literal(1)]),
    // no_share: z.number(),
    // arc_pay: z.number(),
    // free_watch: z.number(),
  }),
  argue_info: z.object({
    argue_msg: z.string(),
    argue_type: z.number(),
    argue_link: z.string(),
  }),
  pages: z
    .object({
      cid: z.number(),
      dimension: z.object({
        width: z.number(),
        height: z.number(),
        rotate: z.number(),
      }),
      first_frame: z.string(),
      duration: z.number(),
      from: z.string(),
      page: z.number(),
      part: z.string(),
      vid: z.string(),
      weblink: z.string(),
    })
    .array(),
  pic: z.string(),
  pubdate: z.number(),
  // pub_location: z.string().nullable(),
  season_id: z.number(),
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
  teenage_mode: z.number(),
  tid: z.number(),
  title: z.string(),
  tname: z.string(),
  videos: z.number(),
})
