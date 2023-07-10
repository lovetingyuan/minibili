import { z } from 'zod'

export const ConfigSchema = z.object({
  brokenVersions: z.array(z.string()),
  statement: z.object({
    title: z.string(),
    content: z.string(),
    dismiss: z.boolean(),
    show: z.boolean(),
    url: z.string().nullish(),
  }),
})
