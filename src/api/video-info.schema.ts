import { z } from 'zod'

export const VideoInfoResponseSchema = z.object({
  aid: z.number(),
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
  // honor_reply: {honor: Array(1)}
  is_chargeable_season: z.boolean(),
  is_season_display: z.boolean(),
  is_story: z.boolean(),
  like_icon: z.string(),
  mission_id: z.number(),
  no_cache: z.boolean(),
  owner: z.object({ mid: z.number(), name: z.string(), face: z.string() }),
  pages: z
    .object({
      cid: z.number(),
      dimension: z.object({
        width: z.number(),
        height: z.number(),
        rotate: z.number(),
      }),
      duration: z.number(),
      // first_frame: z.string(),
      from: z.string(),
      page: z.number(),
      part: z.string(),
      vid: z.string(),
      weblink: z.string(),
    })
    .array(),
  pic: z.string(),
  // premiere: null
  pubdate: z.number(),
  // rights: {bp: 0, elec: 0, download: 1, movie: 0, pay: 0, …}
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
  // subtitle: {allow_submit: true, list: Array(0)}
  teenage_mode: z.number(),
  tid: z.number(),
  title: z.string(),
  tname: z.string(),
  // ugc_season: {id: z.number(),, title: z.string(),, cover: z.string(),, mid: z.number(),, intro: z.string(),, …}
  // user_garb: {url_image_ani_cut: ''}
  videos: z.number(),
})
