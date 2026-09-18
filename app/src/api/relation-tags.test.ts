import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createBilibiliRelationTag,
  deleteBilibiliRelationTag,
  fetchBilibiliRelationTagMembers,
  fetchBilibiliRelationTags,
  fetchBilibiliUpRelationTags,
  fetchAllBilibiliRelationTagMembers,
  getFollowGroupTags,
  getRelationTagMembersKey,
  getSelectableRelationTags,
  getSpecialFollowUpsKey,
  RELATION_TAG_MEMBERS_PAGE_SIZE,
  RelationTagLoginRequiredError,
  RelationTagResultUnknownError,
  renameBilibiliRelationTag,
  setBilibiliUpRelationTags,
} from "./relation-tags";
import type { RelationTagRequest, RelationTagRequestDependencies } from "./relation-tags.types";

const account = { mid: "393120021", generation: 3 };
const tags = [
  { tagid: -10, name: "特别关注", count: 1, tip: "第一时间收到该分组下用户更新稿件的通知" },
  { tagid: 0, name: "默认分组", count: 47, tip: "" },
  { tagid: -2, name: "悄悄关注", count: 0, tip: "" },
  { tagid: 446542, name: "考研", count: 2, tip: "" },
];
const member = {
  mid: 1458143131,
  attribute: 2,
  uname: "侯翠翠",
  face: "https://i1.hdslb.com/bfs/face/2c7c282460812e14a3266f338d563b3ef4b1b009.jpg",
  sign: "自由散漫",
  vip: { vipType: 2 },
};

describe("Bilibili relation tags", () => {
  test("列出分组并保留内置分组的顺序，过滤全部与悄悄关注", async () => {
    const request = vi
      .fn<RelationTagRequest>()
      .mockResolvedValue([{ tagid: -1, name: "全部", count: 48, tip: "" }, ...tags]);
    const result = await fetchBilibiliRelationTags(account, request, () => true);
    expect(request).toHaveBeenCalledWith("/x/relation/tags");
    expect(result).toHaveLength(5);
    expect(getFollowGroupTags(result).map((tag) => tag.tagid)).toEqual([-10, 0, 446542]);
    expect(getSelectableRelationTags(result).map((tag) => tag.tagid)).toEqual([-10, 446542]);
  });

  test("读取分组成员时映射成 UpInfo 并翻页", async () => {
    const request = vi.fn<RelationTagRequest>().mockResolvedValue([member]);
    const members = await fetchBilibiliRelationTagMembers(0, 2, request, () => true);
    expect(request).toHaveBeenCalledWith("/x/relation/tag?tagid=0&pn=2&ps=50");
    expect(members).toEqual([
      { mid: 1458143131, name: "侯翠翠", face: member.face, sign: "自由散漫" },
    ]);
  });

  test("读取 UP 现有分组，缺失时回退成空数组", async () => {
    const request = vi
      .fn<RelationTagRequest>()
      .mockResolvedValueOnce({ mid: 456, attribute: 2, tag: [-10, 446542] })
      .mockResolvedValueOnce({ mid: 456, attribute: 2, tag: null });
    expect(await fetchBilibiliUpRelationTags(456, request, () => true)).toEqual([-10, 446542]);
    expect(await fetchBilibiliUpRelationTags(456, request, () => true)).toEqual([]);
    expect(request).toHaveBeenCalledWith("/x/relation?fid=456");
  });

  test("分页 key 支持默认分组 0 并且在最后一页后停止", () => {
    const fullPage = Array.from({ length: RELATION_TAG_MEMBERS_PAGE_SIZE }, (_, index) => ({
      mid: index + 1,
      name: `UP ${index + 1}`,
      face: "",
      sign: "",
    }));
    expect(getRelationTagMembersKey(account, 0, 0, null)).toEqual([
      "bilibili-relation-tag-members",
      "393120021",
      3,
      0,
      1,
    ]);
    expect(getRelationTagMembersKey(account, 0, 1, fullPage)).toEqual([
      "bilibili-relation-tag-members",
      "393120021",
      3,
      0,
      2,
    ]);
    expect(getRelationTagMembersKey(account, 0, 1, [])).toBeNull();
    expect(getRelationTagMembersKey(account, undefined, 0, null)).toBeNull();
  });

  test("特别关注一次性取全，按 mid 去重并在最后一页停止", async () => {
    const fullPage = Array.from({ length: RELATION_TAG_MEMBERS_PAGE_SIZE }, (_, index) => ({
      ...member,
      mid: index + 1,
    }));
    const request = vi
      .fn<RelationTagRequest>()
      .mockResolvedValueOnce([...fullPage, fullPage[0]])
      .mockResolvedValueOnce([{ ...member, mid: 999 }]);
    const members = await fetchAllBilibiliRelationTagMembers(-10, request, () => true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toBe("/x/relation/tag?tagid=-10&pn=1&ps=50");
    expect(request.mock.calls[1][0]).toBe("/x/relation/tag?tagid=-10&pn=2&ps=50");
    expect(members).toHaveLength(RELATION_TAG_MEMBERS_PAGE_SIZE + 1);
    expect(new Set(members.map((item) => item.mid)).size).toBe(members.length);
    expect(getSpecialFollowUpsKey(account)).toEqual([
      "bilibili-special-follow-ups",
      "393120021",
      3,
    ]);
  });

  test("账号切换时中断读取", async () => {
    const request = vi.fn<RelationTagRequest>().mockResolvedValue(tags);
    await expect(fetchBilibiliRelationTags(account, request, () => false)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();

    let current = true;
    request.mockImplementation(async () => {
      current = false;
      return tags;
    });
    await expect(
      fetchBilibiliRelationTags(account, request, () => current),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });
});

describe("Bilibili relation tag writes", () => {
  const cookie = "SESSDATA=session; DedeUserID=393120021; bili_jct=csrf-token";

  function setup(value: string | null = cookie, body: unknown = { code: 0, message: "0" }) {
    // 每次调用都返回新的 Response，避免 body 被前一次调用消费掉
    const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(body));
    vi.stubGlobal("fetch", request);
    const dependencies: RelationTagRequestDependencies = {
      readCookie: vi.fn(async () => value),
      isCurrentAccount: vi.fn(() => true),
    };
    return { request, dependencies };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("新建分组只提交名称与 CSRF", async () => {
    const { request, dependencies } = setup(undefined, {
      code: 0,
      message: "0",
      data: { tagid: 446542 },
    });
    const result = await createBilibiliRelationTag({ account, name: "考研" }, dependencies);
    expect(result).toEqual({ tagid: 446542 });
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/relation/tag/create");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      tag: "考研",
      csrf: "csrf-token",
    });
  });

  test("重命名与删除自定义分组都提交 tagid", async () => {
    const { request, dependencies } = setup();
    await renameBilibiliRelationTag({ account, tagid: 446542, name: "备考" }, dependencies);
    await deleteBilibiliRelationTag({ account, tagid: 446542 }, dependencies);
    const [[renameUrl, renameOptions], [deleteUrl, deleteOptions]] = request.mock.calls;
    expect(renameUrl).toBe("https://api.bilibili.com/x/relation/tag/update");
    expect(Object.fromEntries(new URLSearchParams(String(renameOptions?.body)))).toEqual({
      tagid: "446542",
      name: "备考",
      csrf: "csrf-token",
    });
    expect(deleteUrl).toBe("https://api.bilibili.com/x/relation/tag/del");
    expect(Object.fromEntries(new URLSearchParams(String(deleteOptions?.body)))).toEqual({
      tagid: "446542",
      csrf: "csrf-token",
    });
  });

  test("拒绝内置分组 ID", async () => {
    const { request, dependencies } = setup();
    for (const tagid of [0, -10, 1.5, Number.NaN]) {
      await expect(
        deleteBilibiliRelationTag({ account, tagid }, dependencies),
      ).rejects.toThrow("分组 ID 无效");
    }
    expect(request).not.toHaveBeenCalled();
  });

  test("设置分组提交 fids 与 tagids，清空可选分组时移回默认分组", async () => {
    const { request, dependencies } = setup();
    await setBilibiliUpRelationTags({ account, mid: 456, tagids: [-10, 446542] }, dependencies);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/relation/tags/addUsers");
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      fids: "456",
      tagids: "-10,446542",
      csrf: "csrf-token",
    });

    await setBilibiliUpRelationTags({ account, mid: 456, tagids: [] }, dependencies);
    const [, emptyOptions] = request.mock.calls[1];
    expect(Object.fromEntries(new URLSearchParams(String(emptyOptions?.body)))).toEqual({
      fids: "456",
      tagids: "0",
      csrf: "csrf-token",
    });

    const invalid = setup();
    await expect(
      setBilibiliUpRelationTags({ account, mid: "abc", tagids: [-10] }, invalid.dependencies),
    ).rejects.toThrow("UP 主 ID 无效");
    expect(invalid.request).not.toHaveBeenCalled();
  });

  test("缺少登录凭据、MID 不匹配或缺少 CSRF 时拒绝写入", async () => {
    await expect(
      createBilibiliRelationTag({ account, name: "考研" }, setup("SESSDATA=session").dependencies),
    ).rejects.toBeInstanceOf(RelationTagLoginRequiredError);

    await expect(
      createBilibiliRelationTag(
        { account, name: "考研" },
        setup("SESSDATA=session; DedeUserID=393120021").dependencies,
      ),
    ).rejects.toBeInstanceOf(RelationTagLoginRequiredError);

    await expect(
      createBilibiliRelationTag(
        { account, name: "考研" },
        setup("SESSDATA=session; DedeUserID=1; bili_jct=csrf-token").dependencies,
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("透传接口错误并在凭据过期时要求重新登录", async () => {
    const expired = setup(undefined, { code: -101, message: "账号未登录" });
    await expect(
      createBilibiliRelationTag({ account, name: "考研" }, expired.dependencies),
    ).rejects.toBeInstanceOf(RelationTagLoginRequiredError);

    const failed = setup(undefined, { code: -400, message: "分组名过长" });
    await expect(
      createBilibiliRelationTag({ account, name: "考研" }, failed.dependencies),
    ).rejects.toThrow("创建分组失败（-400）：分组名过长");
  });

  test("无法确认结果时提示用户先刷新分组", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Network request failed"));
    vi.stubGlobal("fetch", request);
    const dependencies: RelationTagRequestDependencies = {
      readCookie: vi.fn(async () => cookie),
      isCurrentAccount: vi.fn(() => true),
    };
    await expect(
      deleteBilibiliRelationTag({ account, tagid: 446542 }, dependencies),
    ).rejects.toBeInstanceOf(RelationTagResultUnknownError);

    const malformed = setup(undefined, { code: 0, message: "0" });
    await expect(
      createBilibiliRelationTag({ account, name: "考研" }, malformed.dependencies),
    ).rejects.toThrow("创建分组结果异常");
  });
});
