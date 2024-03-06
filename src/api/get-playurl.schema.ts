import { z } from 'zod'

export const PlayUrlResponseSchema = z.object({
  from: z.string(),
  result: z.string(),
  message: z.string(),
  quality: z.number(),
  format: z.string(),
  timelength: z.number(),
  accept_format: z.string(),
  accept_description: z.string().array(),
  accept_quality: z.number().array(),
  video_codecid: z.number(),
  seek_param: z.string(),
  seek_type: z.string(),
  durl: z
    .object({
      order: z.number(),
      length: z.number(),
      size: z.number(),
      ahead: z.string(),
      vhead: z.string(),
      url: z.string(),
      backup_url: z.string().array().nullable(),
    })
    .array(),

  support_formats: z
    .object({
      quality: z.number(),
      format: z.string(),
      new_description: z.string(),
      display_desc: z.string(),
      superscript: z.string(),
      // codecs: null,
    })
    .array(),
  // high_format: null,
  last_play_time: z.number(),
  last_play_cid: z.number(),
  // view_info: null,
})
