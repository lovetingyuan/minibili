import type { UpInfo } from "../../types";

/** 正在直播的 UP 排在最前，其余保持 B站 返回（或本地同步）的顺序。 */
export function orderFollowedUps(ups: UpInfo[], livingUps: Record<string, string>) {
  const liveUps: UpInfo[] = [];
  const otherUps: UpInfo[] = [];

  for (const up of ups) {
    if (livingUps[up.mid]) {
      liveUps.push(up);
    } else {
      otherUps.push(up);
    }
  }

  return [...liveUps, ...otherUps];
}
