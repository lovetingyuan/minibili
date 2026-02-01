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

export const DashUrlResponseSchema = z.object({
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
  dash: z.object({
    duration: z.number(),
    minBufferTime: z.number(),
    min_buffer_time: z.number(),
    video: z
      .object({
        id: z.number(),
        baseUrl: z.string(),
        base_url: z.string(),
        backupUrl: z.string().array(),
        backup_url: z.string().array(),
        bandwidth: z.number(),
        mimeType: z.string(),
        mime_type: z.string(),
        codecs: z.string(),
        width: z.number(),
        height: z.number(),
        frameRate: z.string(),
        frame_rate: z.string(),
        // sar: '1:1',
        // startWithSap: 1,
        // start_with_sap: 1,
        // SegmentBase: {
        //   Initialization: '0-1066',
        //   indexRange: '1067-1926',
        // },
        // segment_base: {
        //   initialization: '0-1066',
        //   index_range: '1067-1926',
        // },
        codecid: z.number(),
      })
      .array(),
    audio: z
      .object({
        id: z.number(),
        baseUrl: z.string(),
        base_url: z.string(),
        backupUrl: z.string().array(),
        backup_url: z.string().array(),
        bandwidth: z.number(),
        mimeType: z.string(),
        mime_type: z.string(),
        codecs: z.string(),
        width: z.number(),
        height: z.number(),
        frameRate: z.string(),
        frame_rate: z.string(),
        // sar: '',
        // startWithSap: 0,
        // start_with_sap: 0,
        // SegmentBase: {
        //   Initialization: '0-907',
        //   indexRange: '908-1779',
        // },
        // segment_base: {
        //   initialization: '0-907',
        //   index_range: '908-1779',
        // },
        codecid: z.number(),
      })
      .array()
      .nullable(),
  }),
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
