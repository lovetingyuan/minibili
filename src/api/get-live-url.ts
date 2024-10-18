import useSWR from 'swr'
import { z } from 'zod'

const ResponseDataSchema = z.object({
  accept_quality: z.string().array(),
  current_qn: z.number(),
  current_quality: z.number(),
  durl: z
    .object({
      length: z.number(),
      order: z.number(),
      url: z.string(),
    })
    .array(),
  quality_description: z
    .object({
      desc: z.string(),
      qn: z.number(),
    })
    .array(),
})

export default function useLiveUrl(roomId: string) {
  const { data } = useSWR<z.infer<typeof ResponseDataSchema>>(
    roomId
      ? 'https://api.live.bilibili.com/room/v1/Room/playUrl?cid=' + roomId
      : null,
  )
  return data?.durl.map((v) => v.url)
}
