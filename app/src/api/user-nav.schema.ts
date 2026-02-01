import { z } from 'zod'

const Schema = z.object({
  isLogin: z.boolean(),
  wbi_img: z.object({
    img_url: z.string(),
    sub_url: z.string(),
  }),
})

export default Schema

export type UserNavType = z.infer<typeof Schema>
