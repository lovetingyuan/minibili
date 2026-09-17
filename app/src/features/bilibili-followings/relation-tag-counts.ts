import type { Cache, Key, ScopedMutator } from "swr";
import { unstable_serialize } from "swr";

import { getRelationTagsKey, getRelationUpTagsKey } from "../../api/relation-tags";
import type { RelationTag, RelationTagAccount } from "../../api/relation-tags.types";

/**
 * 设置分组写成功后，B站 的分组人数统计常常还是写之前的值，
 * 立刻拉分组列表会拿到旧数字，按这个节奏重试直到服务端追上。
 */
const TAG_COUNT_RETRY_DELAYS = [1000, 1500, 2500];

// 同一个 UP 连续改分组时，只让最后一次同步补正人数，避免旧任务覆盖新结果。
const syncRevisions = new Map<string, number>();

export function getCachedData<T>(cache: Cache, key: Key) {
  return cache.get(unstable_serialize(key))?.data as T | undefined;
}

/** 设置分组后各分组的人数变化：移入的分组 +1，移出的分组 -1。 */
export function getTagCountChanges(previous: readonly number[], next: readonly number[]) {
  const changes = new Map<number, number>();
  for (const tagid of new Set([...previous, ...next])) {
    const delta = Number(next.includes(tagid)) - Number(previous.includes(tagid));
    if (delta) {
      changes.set(tagid, delta);
    }
  }
  return changes;
}

/** 按人数变化就地更新分组列表，其它字段保持原样。 */
export function shiftTagCounts(tags: readonly RelationTag[], changes: ReadonlyMap<number, number>) {
  return tags.map((tag) => {
    const delta = changes.get(tag.tagid);
    return delta ? { ...tag, count: Math.max(0, tag.count + delta) } : tag;
  });
}

/**
 * 服务端还没算上本次变更的分组：人数仍等于写之前的值。
 * 只有这种情况才需要按本地结果补正，否则会把服务端已经更新的数字再加一次。
 */
export function getPendingTagCountChanges(
  before: readonly RelationTag[],
  after: readonly RelationTag[],
  changes: ReadonlyMap<number, number>,
) {
  const beforeCounts = new Map(before.map((tag) => [tag.tagid, tag.count]));
  const afterCounts = new Map(after.map((tag) => [tag.tagid, tag.count]));
  const pending = new Map<number, number>();
  for (const [tagid, delta] of changes) {
    const count = beforeCounts.get(tagid);
    if (count !== undefined && afterCounts.get(tagid) === count) {
      pending.set(tagid, delta);
    }
  }
  return pending;
}

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
}

function startCountSync(account: RelationTagAccount, mid: string | number) {
  const key = `${account.mid}:${account.generation}:${String(mid)}`;
  const revision = (syncRevisions.get(key) ?? 0) + 1;
  syncRevisions.set(key, revision);
  return () => syncRevisions.get(key) === revision;
}

/**
 * 设置分组成功后同步 tab 上的人数：先按确认的分组变化在本地更新，
 * 再延迟重试分组列表，直到服务端的人数反映出这次变更。
 */
export async function syncRelationTagCounts(
  mutate: ScopedMutator,
  cache: Cache,
  account: RelationTagAccount,
  mid: string | number,
  tagids: readonly number[],
  isCurrent: () => boolean,
) {
  const tagsKey = getRelationTagsKey(account);
  const upTagsKey = getRelationUpTagsKey(account, mid);
  const before = getCachedData<RelationTag[]>(cache, tagsKey);
  const previous = getCachedData<number[]>(cache, upTagsKey);
  const isLatest = startCountSync(account, mid);
  const changes =
    before && previous ? getTagCountChanges(previous, tagids) : new Map<number, number>();
  // 同步写入缓存，tab 上的人数立刻更新，不用等服务端的统计
  const counted =
    before && changes.size
      ? mutate(tagsKey, shiftTagCounts(before, changes), { revalidate: false }).catch(() => {})
      : Promise.resolve();
  // 写接口已经确认成功，本地直接记下这次选择，避免下次打开弹窗看到旧勾选。
  await mutate(upTagsKey, tagids, { revalidate: false }).catch(() => {});
  await counted;
  if (!before || !previous) {
    // 拿不到写之前的快照就算不出人数变化，退化成普通刷新。
    await mutate(tagsKey).catch(() => {});
    return;
  }
  if (!changes.size) {
    return;
  }
  for (const delay of TAG_COUNT_RETRY_DELAYS) {
    await wait(delay);
    if (!isLatest() || !isCurrent()) {
      return;
    }
    const tags = await mutate<RelationTag[]>(tagsKey).catch(() => undefined);
    if (!tags) {
      return;
    }
    const pending = getPendingTagCountChanges(before, tags, changes);
    if (!pending.size) {
      return;
    }
    // 服务端还是写之前的数字：保留本地结果，稍后再重试。
    await mutate(tagsKey, shiftTagCounts(tags, pending), { revalidate: false }).catch(() => {});
  }
}
