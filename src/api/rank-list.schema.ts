import { z } from 'zod'

import { VideoItemResponseSchema } from './hot-videos.schema'

export const RankVideosDataResponseSchema = z.object({
  list: VideoItemResponseSchema.array(),
  note: z.string(),
})
