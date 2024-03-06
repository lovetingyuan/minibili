import useSWR from 'swr'
import { z } from 'zod'

import { DanmakuSchema } from './get-danmaku.schema'

type Res = z.infer<typeof DanmakuSchema>

export function useDanmaku(cid: string | number, index: number) {
  // /x/v2/dm/web/seg.so?type=1&oid=1459734495&pid=1001385310&segment_index=1
  const { data } = useSWR<Res>(
    cid ? `/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${index}` : null,
  )
  return data
}
