import React from "react";

import { useLiveUps } from "@/api/live-ups";
import { useStore } from "@/store";

function LiveUpsManager() {
  const { data } = useLiveUps();
  const { setLivingUps } = useStore();

  React.useEffect(() => {
    const livingUps: Record<string, string> = {};
    for (const item of data?.items ?? []) {
      livingUps[item.mid] = item.link;
    }
    setLivingUps(livingUps);
  }, [data]);

  return null;
}

export default LiveUpsManager;
