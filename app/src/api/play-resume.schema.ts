import { z } from "zod";

/** `/x/player/wbi/v2` 的 data：只取续播用到的字段，其余字段忽略 */
export const PlayResumeInfoSchema = z.object({
  /** 最后播放位置（毫秒），看完或没有记录时是 -1000 */
  last_play_time: z.number().nullish(),
  /** 最后播放的分P，与当前 cid 不一致时不能套用这个位置 */
  last_play_cid: z.number().nullish(),
});
