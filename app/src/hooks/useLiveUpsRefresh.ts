import React from "react";

import { useLiveUps } from "@/api/live-ups";

/**
 * 离开直播间（返回上一页）时补拉一次直播列表。
 * 在直播间停留期间主播可能已经下播，返回后角标要按最新的直播状态展示。
 */
export function useLiveUpsRefresh() {
  const { mutate } = useLiveUps();

  React.useEffect(() => {
    return () => {
      void mutate().catch(() => {});
    };
  }, [mutate]);
}
