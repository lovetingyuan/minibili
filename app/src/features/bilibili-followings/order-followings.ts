import type { UpInfo } from "../../types";

/**
 * 排序：正在直播 → 有未读动态 → 其余；
 * 每一档里特别关注排在前面（所以「有更新的特别关注」比其他有更新的 UP 更靠前）。
 * 每个小分组内保持 B站 返回（或本地同步）的顺序。
 */
export function orderFollowedUps(
  ups: UpInfo[],
  livingUps: Record<string, string>,
  specialMids?: ReadonlySet<string>,
  unreadMids?: ReadonlySet<string>,
) {
  const specialLiveUps: UpInfo[] = [];
  const liveUps: UpInfo[] = [];
  const specialUpdatedUps: UpInfo[] = [];
  const updatedUps: UpInfo[] = [];
  const specialUps: UpInfo[] = [];
  const otherUps: UpInfo[] = [];

  for (const up of ups) {
    const special = Boolean(specialMids?.has(String(up.mid)));
    if (livingUps[up.mid]) {
      (special ? specialLiveUps : liveUps).push(up);
    } else if (unreadMids?.has(String(up.mid))) {
      (special ? specialUpdatedUps : updatedUps).push(up);
    } else if (special) {
      specialUps.push(up);
    } else {
      otherUps.push(up);
    }
  }

  return [
    ...specialLiveUps,
    ...liveUps,
    ...specialUpdatedUps,
    ...updatedUps,
    ...specialUps,
    ...otherUps,
  ];
}
