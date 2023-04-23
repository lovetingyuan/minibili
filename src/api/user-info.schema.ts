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
