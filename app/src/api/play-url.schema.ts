import { z } from "zod";

const DashStreamSchema = z.object({
  id: z.number(),
  base_url: z.url(),
  backup_url: z.array(z.url()).nullish(),
  bandwidth: z.number().positive(),
  mime_type: z.string(),
  codecs: z.string(),
  width: z.number(),
  height: z.number(),
  frame_rate: z.string(),
  segment_base: z.object({
    initialization: z.string().regex(/^\d+-\d+$/),
    index_range: z.string().regex(/^\d+-\d+$/),
  }),
  codecid: z.number(),
});

export const DashManifestSchema = z.object({
  duration: z.number().positive(),
  video: z.array(DashStreamSchema),
  audio: z.array(DashStreamSchema).nullish(),
});

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
});

export const DashPlayUrlResponseSchema = z.object({
  quality: z.number(),
  timelength: z.number().nonnegative(),
  dash: DashManifestSchema.nullish(),
});
