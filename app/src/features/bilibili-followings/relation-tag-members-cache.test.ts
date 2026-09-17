import type { ScopedMutator } from "swr";
import { mutate, SWRConfig, unstable_serialize as serializeKey } from "swr";
import { unstable_serialize } from "swr/infinite";
import { describe, expect, test } from "vitest";

import { getRelationTagMembersKey } from "../../api/relation-tags";
import type { RelationTagAccount } from "../../api/relation-tags.types";
import type { UpInfo } from "../../types";
import { revalidateRelationTagMembers } from "./relation-tag-members-cache";

const account: RelationTagAccount = { mid: "1", generation: 1 };
const otherAccount: RelationTagAccount = { mid: "2", generation: 1 };
const specialMembers: UpInfo[] = [{ mid: 10, name: "UP", face: "", sign: "" }];
const defaultMembers: UpInfo[] = [{ mid: 11, name: "UP2", face: "", sign: "" }];

async function seed(key: Parameters<typeof serializeKey>[0], data: unknown) {
  await mutate(key, data, { revalidate: false });
  // useSWRInfinite 保存原始 key，供全局 mutate 的过滤器识别。
  const serialized = serializeKey(key);
  const cache = SWRConfig.defaultValue.cache;
  const entry = { ...cache.get(serialized), _k: key };
  cache.set(serialized, entry);
}

function createRecordingMutate() {
  const keys: unknown[] = [];
  const record = ((...args: unknown[]) => {
    const [key, ...rest] = args;
    keys.push(key);
    return (mutate as unknown as (...rest: unknown[]) => Promise<unknown>)(key, ...rest);
  }) as unknown as ScopedMutator;
  return { keys, mutate: record };
}

describe("relation tag members cache", () => {
  test("写操作后清掉分页缓存，并重新校验挂载中列表的聚合 key", async () => {
    const specialPage = getRelationTagMembersKey(account, -10, 0, null)!;
    const defaultPage = getRelationTagMembersKey(account, 0, 0, null)!;
    const otherAccountPage = getRelationTagMembersKey(otherAccount, -10, 0, null)!;
    const infiniteKey = unstable_serialize(() => getRelationTagMembersKey(account, -10, 0, null));
    await seed(specialPage, specialMembers);
    await seed(defaultPage, defaultMembers);
    await seed(otherAccountPage, specialMembers);
    await seed(infiniteKey, [specialMembers]);

    const recording = createRecordingMutate();
    await revalidateRelationTagMembers(recording.mutate, account, [-10]);

    // 聚合 key 必须被重新校验，否则挂载中的列表只清分页缓存不会重新请求。
    expect(recording.keys).toContain(infiniteKey);
    expect(await mutate(specialPage)).toBeUndefined();
    // 聚合数据保留，列表重新请求期间不会先闪成空列表。
    expect(await mutate(infiniteKey)).toEqual([specialMembers]);
    // 其他分组与账号的缓存不受影响
    expect(await mutate(defaultPage)).toEqual(defaultMembers);
    expect(await mutate(otherAccountPage)).toEqual(specialMembers);
  });

  test("没有需要刷新的分组时不改动缓存", async () => {
    const specialPage = getRelationTagMembersKey(account, -10, 0, null)!;
    await seed(specialPage, specialMembers);

    const recording = createRecordingMutate();
    await revalidateRelationTagMembers(recording.mutate, account, []);

    expect(recording.keys).toEqual([]);
    expect(await mutate(specialPage)).toEqual(specialMembers);
  });
});
