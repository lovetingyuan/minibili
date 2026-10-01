import useSWR from "swr";
import type { z } from "zod";

import request from "./fetcher";
import type { LiveInfoBatchItemSchema } from "./living-info.schema";

// https://api.live.bilibili.com/live_user/v1/Master/info?uid=
// https://api.live.bilibili.com/room/v1/Room/get_info?room_id=
// https://api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web

export const useLivingInfo = (mid?: string | number) => {
  const { data } = useSWR<Record<string, z.infer<typeof LiveInfoBatchItemSchema>>>(
    mid ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=${mid}` : null,
    request,
    {
      refreshInterval: 5 * 60 * 1000,
      dedupingInterval: 60 * 1000,
    },
  );
  if (data && mid) {
    const { live_status, room_id } = data?.[mid] || {};
    return {
      livingUrl: live_status === 1 ? `https://live.bilibili.com/h5/${room_id}` : "",
      // 未开播时接口也会返回 room_id，可以据此进入（未开播状态的）直播间
      roomId: room_id && room_id > 0 ? room_id : undefined,
    };
  }
  return {
    livingUrl: "",
    roomId: undefined,
  };
};
