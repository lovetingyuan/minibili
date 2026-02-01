import { z } from 'zod'

export default z.object({
  addr: z.string(),
  country: z.string(),
  province: z.string(),
  city: z.string(),
  isp: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  zone_id: z.number(),
  country_code: z.number(),
})
