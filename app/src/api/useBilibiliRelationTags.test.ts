import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import type { UpInfo } from "../types";
import {
  getRelationTagsKey,
  getRelationUpTagsKey,
  getSpecialFollowUpsKey,
  RelationTagResultUnknownError,
} from "./relation-tags";
import { getRelationTagMembersInfiniteKey } from "../features/bilibili-followings/relation-tag-members-cache";
import type {
  RelationTagAccount,
  RelationTagMembersKeyLoader,
} from "./relation-tags.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "1", generation: 1 } as RelationTagAccount | null,
  current: true,
  pending: { current: false },
  refs: [] as { current: unknown }[],
  refIndex: 0,
  effects: [] as (() => void)[],
  infinite: vi.fn(),
  swr: vi.fn(),
  request: vi.fn(),
  mutateCache: vi.fn(),
  cache: { get: vi.fn<(key: string) => unknown>(() => undefined) },
  tags: [] as { tagid: number; name: string; count: number; tip: string }[],
  createTag: vi.fn(),
  renameTag: vi.fn(),
  deleteTag: vi.fn(),
  setUpGroups: vi.fn(),
  response: {
    data: undefined as UpInfo[][] | undefined,
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined as Error | undefined,
    setSize:
      vi.fn<(value: number | ((size: number) => number)) => Promise<UpInfo[][] | undefined>>(),
    mutate: vi.fn<() => Promise<UpInfo[][] | undefined>>(),
  },
}));

vi.mock("react", () => ({
  // 分页 hook 用 useRef(false) 作为进行中标记，其余 ref 按调用顺序独立保存
  useRef: (initial: unknown) => {
    if (initial === false) return mocks.pending;
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  },
  useEffect: (effect: () => void) => {
    mocks.effects.push(effect);
  },
}));
vi.mock("swr", () => ({
  default: mocks.swr,
  useSWRConfig: () => ({ mutate: mocks.mutateCache, cache: mocks.cache }),
  unstable_serialize: (key: unknown) => JSON.stringify(key),
}));
vi.mock("swr/infinite", () => ({
  default: mocks.infinite,
  // 真实实现只依赖 key 序列化，这里用等价字符串代替，方便断言聚合 key
  unstable_serialize: (getKey: (index: number, previous: unknown) => unknown) =>
    `$inf$${JSON.stringify(getKey(0, null))}`,
}));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: mocks.account }),
}));
vi.mock("./fetcher", () => ({ default: mocks.request }));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: vi.fn() }));
vi.mock("./relation-tags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./relation-tags")>()),
  createBilibiliRelationTag: mocks.createTag,
  renameBilibiliRelationTag: mocks.renameTag,
  deleteBilibiliRelationTag: mocks.deleteTag,
  setBilibiliUpRelationTags: mocks.setUpGroups,
}));

import {
  useBilibiliRelationTagMembers,
  useBilibiliRelationTags,
  useBilibiliSpecialFollowUps,
  useRelationTagActions,
} from "./useBilibiliRelationTags";

const account = { mid: "1", generation: 1 };
const up: UpInfo = { mid: 10, name: "UP", face: "", sign: "" };
const nextUp: UpInfo = { mid: 11, name: "UP2", face: "", sign: "" };
const createdTag = { tagid: 446542 };
const fullPage: UpInfo[] = Array.from({ length: 50 }, (_, index) => ({
  mid: index + 1,
  name: `UP ${index + 1}`,
  face: "",
  sign: "",
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = account;
  mocks.current = true;
  mocks.pending.current = false;
  mocks.refs = [];
  mocks.refIndex = 0;
  mocks.effects = [];
  mocks.cache.get.mockReset().mockReturnValue(undefined);
  mocks.tags = [
    { tagid: -10, name: "特别关注", count: 1, tip: "" },
    { tagid: 0, name: "默认分组", count: 3, tip: "" },
    { tagid: 446542, name: "考研", count: 2, tip: "" },
  ];
  // 刷新分组列表时返回最新分组：成员刷新的分组范围由它决定（这里是缓存为空的场景）
  mocks.mutateCache.mockImplementation((key: unknown) =>
    Promise.resolve(
      Array.isArray(key) && key[0] === "bilibili-relation-tags" ? mocks.tags : undefined,
    ),
  );
  mocks.createTag.mockResolvedValue(createdTag);
  mocks.renameTag.mockResolvedValue(undefined);
  mocks.deleteTag.mockResolvedValue(undefined);
  mocks.setUpGroups.mockResolvedValue(undefined);
  Object.assign(mocks.response, {
    data: [[up]],
    size: 1,
    isLoading: false,
    isValidating: false,
    error: undefined,
  });
  mocks.response.setSize.mockResolvedValue([[up]]);
  mocks.response.mutate.mockResolvedValue([[up]]);
  mocks.infinite.mockReturnValue(mocks.response);
  mocks.swr.mockReturnValue({ data: [{ tagid: -10, name: "特别关注", count: 1, tip: "" }] });
  mocks.request.mockResolvedValue([up]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("relation tag hooks", () => {
  test("没有当前账号时不请求分组与分组成员", () => {
    mocks.account = null;
    expect(useBilibiliRelationTags().data).toBeUndefined();
    expect(mocks.swr.mock.calls[0][0]).toBeNull();

    const members = useBilibiliRelationTagMembers(0);
    const getKey: RelationTagMembersKeyLoader = mocks.infinite.mock.calls[0][0];
    expect(getKey(0, null)).toBeNull();
    expect(members.items).toEqual([]);
  });

  test("分页 key 由账号与分组决定，并按 mid 去重", () => {
    mocks.response.data = [[up, { ...up }], [nextUp]];
    mocks.response.size = 2;
    const members = useBilibiliRelationTagMembers(0);
    const getKey: RelationTagMembersKeyLoader = mocks.infinite.mock.calls[0][0];
    expect(getKey(0, null)).toEqual(["bilibili-relation-tag-members", "1", 1, 0, 1]);
    expect(members.items).toEqual([up, nextUp]);
    // 最后一页不足一页说明已经到底
    expect(members.hasMore).toBe(false);

    mocks.response.data = [[{ ...up, mid: 10 }, ...fullPage.slice(1)]];
    expect(useBilibiliRelationTagMembers(0).hasMore).toBe(true);
  });

  test("对同一份 key 只发起一个下一页请求", async () => {
    mocks.response.data = [fullPage];
    const pending = Promise.withResolvers<UpInfo[][] | undefined>();
    mocks.response.setSize.mockReturnValueOnce(pending.promise);
    const members = useBilibiliRelationTagMembers(0);
    const first = members.loadMore();
    await members.loadMore();
    expect(mocks.response.setSize).toHaveBeenCalledOnce();
    const nextSize = mocks.response.setSize.mock.calls[0][0];
    expect(typeof nextSize === "function" ? nextSize(1) : nextSize).toBe(2);
    pending.resolve([[]]);
    await first;
    expect(mocks.pending.current).toBe(false);
  });

  test.each(["loading", "validating", "error", "end"] as const)(
    "%s 状态下不再加载下一页",
    async (state) => {
      if (state === "loading") mocks.response.isLoading = true;
      if (state === "validating") mocks.response.isValidating = true;
      if (state === "error") mocks.response.error = new Error("page failed");
      if (state === "end") mocks.response.data = [[]];
      await useBilibiliRelationTagMembers(0).loadMore();
      expect(mocks.response.setSize).not.toHaveBeenCalled();
    },
  );

  test("切换分组时回到第一页，刷新时先收回分页再请求", async () => {
    mocks.response.size = 3;
    const members = useBilibiliRelationTagMembers(446542);
    mocks.effects.forEach((effect) => effect());
    expect(mocks.response.setSize).toHaveBeenCalledWith(1);
    mocks.response.setSize.mockClear();
    await members.refresh();
    expect(mocks.response.setSize).toHaveBeenCalledWith(1);
    expect(mocks.response.mutate).toHaveBeenCalledOnce();
    expect(mocks.response.setSize.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.response.mutate.mock.invocationCallOrder[0],
    );
  });

  test("特别关注成员集合用于全部列表的排序与高亮", async () => {
    useBilibiliSpecialFollowUps();
    const [key, load] = mocks.swr.mock.calls.at(-1) as [unknown, () => Promise<Set<string>>];
    expect(key).toEqual(["bilibili-special-follow-ups", "1", 1]);
    const member = { mid: 10, uname: "UP", face: "", sign: "" };
    mocks.request.mockResolvedValueOnce([member, { ...member, mid: 11 }, member]);
    await expect(load()).resolves.toEqual(new Set(["10", "11"]));
    expect(mocks.request).toHaveBeenCalledWith("/x/relation/tag?tagid=-10&pn=1&ps=50");
  });
});

describe("relation tag actions", () => {
  const dependencies = expect.anything();

  test("新建分组后刷新分组列表并返回新的 tagid", async () => {
    const actions = useRelationTagActions();
    await expect(actions.createTag("考研")).resolves.toEqual(createdTag);
    expect(mocks.createTag).toHaveBeenCalledWith({ account, name: "考研" }, dependencies);
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagsKey(account));
  });

  test("重命名分组后刷新分组列表", async () => {
    const actions = useRelationTagActions();
    await actions.renameTag(446542, "备考");
    expect(mocks.renameTag).toHaveBeenCalledWith(
      { account, tagid: 446542, name: "备考" },
      dependencies,
    );
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagsKey(account));
  });

  test("删除分组先清掉该分组成员缓存，再刷新分组列表", async () => {
    const actions = useRelationTagActions();
    await actions.deleteTag(446542);
    expect(mocks.deleteTag).toHaveBeenCalledWith({ account, tagid: 446542 }, dependencies);
    expect(mocks.mutateCache.mock.calls.some(([key]) => typeof key === "function")).toBe(true);
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagsKey(account));
    // 被删除分组的 UP 会回到默认分组，默认分组列表要重新拉取
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagMembersInfiniteKey(account, 0));
  });

  test("设置分组后刷新分组列表并重新校验成员", async () => {
    const actions = useRelationTagActions();
    await actions.setUpGroups(10, [-10, 446542]);
    expect(mocks.setUpGroups).toHaveBeenCalledWith(
      { account, mid: 10, tagids: [-10, 446542] },
      dependencies,
    );
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagsKey(account));
    // 先清分页缓存（不重新校验单页），再重新校验每个分组的聚合 key
    expect(mocks.mutateCache.mock.calls.some(([key]) => typeof key === "function")).toBe(true);
    expect(mocks.mutateCache).toHaveBeenCalledWith(expect.any(Function), undefined, {
      revalidate: false,
    });
    // 缓存里没有分组列表时，至少保证本次选择的分组会重新拉取
    for (const tagid of [-10, 446542]) {
      expect(mocks.mutateCache).toHaveBeenCalledWith(
        getRelationTagMembersInfiniteKey(account, tagid),
      );
    }
    expect(mocks.mutateCache).toHaveBeenCalledWith(getSpecialFollowUpsKey(account), undefined, {
      revalidate: true,
    });
  });

  test("移出特别关注后立即更新成员列表与高亮缓存", async () => {
    vi.useFakeTimers();
    const upTagsKey = getRelationUpTagsKey(account, up.mid);
    const specialKey = getSpecialFollowUpsKey(account);
    let currentUpTags = [-10];
    mocks.cache.get.mockImplementation((key: string) => {
      if (key === JSON.stringify(upTagsKey)) return { data: currentUpTags };
      if (key === JSON.stringify(specialKey)) return { data: new Set(["10", "11"]) };
      return undefined;
    });
    mocks.mutateCache.mockImplementation((key: unknown, data?: unknown) => {
      if (JSON.stringify(key) === JSON.stringify(upTagsKey) && Array.isArray(data)) {
        currentUpTags = data;
      }
      return Promise.resolve(undefined);
    });

    const actions = useRelationTagActions();
    await actions.setUpGroups(up.mid, []);

    const memberCall = mocks.mutateCache.mock.calls.find(
      ([key, data]) =>
        key === getRelationTagMembersInfiniteKey(account, -10) && typeof data === "function",
    );
    expect(memberCall).toBeDefined();
    expect(memberCall?.[1]([[up, nextUp]])).toEqual([[nextUp]]);
    expect(mocks.mutateCache).toHaveBeenCalledWith(specialKey, new Set(["11"]), {
      revalidate: false,
    });
    // 已确认移出的分组不立刻请求，避免服务端短暂的旧响应把成员恢复。
    expect(mocks.mutateCache).not.toHaveBeenCalledWith(
      getRelationTagMembersInfiniteKey(account, -10),
    );
    await vi.advanceTimersByTimeAsync(1500);
    expect(mocks.mutateCache).toHaveBeenCalledWith(
      getRelationTagMembersInfiniteKey(account, -10),
    );
  });

  test("结果不确定时先刷新分组再报错", async () => {
    mocks.createTag.mockRejectedValueOnce(new RelationTagResultUnknownError("无法确认创建分组结果"));
    const actions = useRelationTagActions();
    await expect(actions.createTag("考研")).rejects.toThrow(
      "无法确认创建分组结果，已刷新分组列表",
    );
    expect(mocks.mutateCache).toHaveBeenCalledWith(getRelationTagsKey(account));
  });

  test("同一个分组的重复操作会被拦截", async () => {
    const pending = Promise.withResolvers<void>();
    mocks.deleteTag.mockReturnValueOnce(pending.promise);
    const actions = useRelationTagActions();
    const first = actions.deleteTag(446542);
    await expect(actions.deleteTag(446542)).rejects.toThrow("操作正在进行，请稍候");
    pending.resolve();
    await first;
    expect(mocks.deleteTag).toHaveBeenCalledOnce();
  });

  test("没有当前账号时拒绝写入", async () => {
    mocks.account = null;
    const actions = useRelationTagActions();
    await expect(actions.createTag("考研")).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    mocks.account = account;
    mocks.current = false;
    await expect(actions.deleteTag(446542)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(mocks.createTag).not.toHaveBeenCalled();
    expect(mocks.deleteTag).not.toHaveBeenCalled();
  });
});
