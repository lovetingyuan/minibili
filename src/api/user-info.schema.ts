import { z } from 'zod'

export const UserInfoResponseSchema = z.object({
  birthday: z.string(),
  coins: z.number(),
  face: z.string(),
  level: z.number(),
  mid: z.number(),
  name: z.string(),
  sex: z.string(),
  sign: z.string(),
  is_followed: z.boolean(),
  is_risk: z.boolean(),
  live_room: z
    .object({
      roomStatus: z.number(),
      liveStatus: z.number(),
      url: z.string(),
      title: z.string(),
      cover: z.string(),
      roomid: z.number(),
      roundStatus: z.number(),
      // broadcast_type: z.number(),
      // watched_show: {
      //   switch: true,
      //   num: 12,
      //   text_small: '12',
      //   text_large: '12人看过',
      //   icon: 'https://i0.hdslb.com/bfs/live/a725a9e61242ef44d764ac911691a7ce07f36c1d.png',
      //   icon_location: '',
      //   icon_web:
      //     'https://i0.hdslb.com/bfs/live/8d9d0f33ef8bf6f308742752d13dd0df731df19c.png',
      // },
    })
    .nullable(),
})

export const UserCardInfoResponseSchema = z.object({
  card: z.object({
    mid: z.string(),
    name: z.string(),
    // approve: false,
    sex: z.string(),
    // rank: '10000',
    face: z.string(),
    // face_nft: 0,
    // face_nft_type: 0,
    // DisplayRank: '0',
    // regtime: 0,
    // spacesta: 0,
    birthday: z.string(),
    place: z.string(),
    description: z.string(),
    // article: 0,
    // attentions: [],
    fans: z.number(),
    friend: z.number(),
    attention: z.number(),
    sign: z.string(),
    level_info: z.object({
      current_level: z.number(),
    }),
    vip: z.object({
      status: z.number(),
    }),
  }),
  following: z.boolean(),
  // archive_count: 16,
  // article_count: 0,
  follower: z.number(),
  // like_num: 6,
})
