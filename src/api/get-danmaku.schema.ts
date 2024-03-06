import { z } from 'zod'

export const DanmakuSchema = z.object({
  color: z.number(),
  content: z.string(),
  ctime: z.number(),
  fontsize: z.number(),
  id: z.number(),
  idStr: z.string(),
  midHash: z.string(),
  mode: z.number(),
  progress: z.number(),
  weight: z.number(),
})
