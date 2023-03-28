// https://api.bilibili.com/x/emote/user/panel/web?business=reply
import { z } from 'zod'
export const emojiItem = z.object({
  id: z.number(),
  package_id: z.number(),
  text: z.string(),
  url: z.string(),
  mtime: z.number(),
  type: z.number(),
  attr: z.number(),
  // meta: {
  //   size: 1,
  //   suggest: ['2023'],
  // },
  // flags: {
  //   unlocked: false,,
  // },
  // 'activity': null,
})
export const emojiPackage = z.object({
  attr: z.number(),
  emote: emojiItem.array(),
  id: z.number(),
  mtime: z.number(),
  text: z.string(),
  type: z.number(),
  url: z.string(),
})

export const emojiResponseSchema = z.object({
  packages: emojiPackage.array(),
})
