import type { UpInfo } from "@/types";

import { useActiveFollowedUps } from "./followings";

export const useFollowedUpsMap = () => {
  const $followedUps = useActiveFollowedUps();
  const ups: Record<string, UpInfo> = {};
  for (const up of $followedUps) {
    ups[up.mid] = up;
  }
  return ups;
};
