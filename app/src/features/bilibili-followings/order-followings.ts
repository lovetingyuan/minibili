import type { UpInfo } from "../../types";

/**
 * 排序：特别关注 → 正在直播 → 其余，组内保持 B站 返回（或本地同步）的顺序。
 */
export function orderFollowedUps(
  ups: UpInfo[],
  livingUps: Record<string, string>,
  specialMids?: ReadonlySet<string>,
) {
  const specialUps: UpInfo[] = [];
  const liveUps: UpInfo[] = [];
  const otherUps: UpInfo[] = [];

  for (const up of ups) {
    if (specialMids?.has(String(up.mid))) {
      specialUps.push(up);
    } else if (livingUps[up.mid]) {
      liveUps.push(up);
    } else {
      otherUps.push(up);
    }
  }

  return [...specialUps, ...liveUps, ...otherUps];
}
