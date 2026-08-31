import type { UpdateUpInfo } from "../../store/types";
import type { UpInfo } from "../../types";

export function orderFollowedUps(
  ups: UpInfo[],
  pinnedUpIds: string[],
  livingUps: Record<string, string>,
  upUpdateMap: Record<string, UpdateUpInfo>,
) {
  const byMid = new Map(ups.map((up) => [up.mid.toString(), up]));
  const pinnedIds = new Set(pinnedUpIds);
  const pinnedUps = pinnedUpIds.flatMap((id) => {
    const up = byMid.get(id);
    return up ? [up] : [];
  });
  const liveUps: UpInfo[] = [];
  const updatedUps: UpInfo[] = [];
  const otherUps: UpInfo[] = [];

  for (const up of ups) {
    if (pinnedIds.has(up.mid.toString())) continue;
    const update = upUpdateMap[up.mid];
    if (livingUps[up.mid]) liveUps.push(up);
    else if (update && update.latestId !== update.currentLatestId) updatedUps.push(up);
    else otherUps.push(up);
  }

  return [...pinnedUps, ...liveUps, ...updatedUps, ...otherUps];
}
