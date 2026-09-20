import type { SearchedUpType } from "@/api/search-up";
import type { UpInfo } from "@/types";

export type UpSearchItem = {
  mid: number | string;
  name: string;
  face: string;
  sign: string;
  /** 接口搜索结果的粉丝数，本地已关注命中项没有该字段 */
  fans?: number;
};

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

/**
 * UP 搜索结果由两部分拼成：前面是本地已关注 UP 里名称命中关键词的项，
 * 后面是接口搜索结果（去掉与前排重复的 mid）。
 */
export function buildUpSearchItems(
  keyword: string,
  followedUps: readonly UpInfo[],
  searchedUps: readonly SearchedUpType[] | undefined,
): UpSearchItem[] {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return [];
  }

  const followedItems: UpSearchItem[] = [];
  const matchedMids = new Set<string>();
  for (const up of followedUps) {
    const mid = String(up.mid);
    if (matchedMids.has(mid) || !up.name.toLowerCase().includes(normalized)) {
      continue;
    }
    matchedMids.add(mid);
    followedItems.push({
      mid: up.mid,
      name: up.name,
      face: up.face,
      sign: up.sign,
    });
  }

  const apiItems: UpSearchItem[] = [];
  const seenMids = new Set(matchedMids);
  for (const up of searchedUps ?? []) {
    const mid = String(up.mid);
    if (seenMids.has(mid)) {
      continue;
    }
    seenMids.add(mid);
    apiItems.push({
      mid: up.mid,
      name: up.name,
      face: up.face,
      sign: up.sign,
      fans: up.fans,
    });
  }

  return [...followedItems, ...apiItems];
}
