import { z } from "zod";

const LiveStreamCodecSchema = z.object({
  codec_name: z.string(),
  base_url: z.string(),
  drm: z.boolean().optional(),
  url_info: z.array(z.object({ host: z.string(), extra: z.string() })),
});

export const LivePlayInfoSchema = z.object({
  room_id: z.number(),
  live_status: z.number(),
  playurl_info: z
    .object({
      playurl: z
        .object({
          stream: z.array(
            z.object({
              protocol_name: z.string(),
              format: z.array(
                z.object({ format_name: z.string(), codec: z.array(LiveStreamCodecSchema) }),
              ),
            }),
          ),
        })
        .nullish(),
    })
    .nullish(),
});
