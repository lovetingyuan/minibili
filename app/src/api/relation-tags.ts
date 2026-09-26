import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  isBilibiliAuthExpiredCode,
  reportBilibiliAuthExpired,
} from "../features/bilibili-session/auth-expiration";
import { LoginRequiredError } from "../features/bilibili-session/login-required";
import type { UpInfo } from "../types";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import {
  RelationTagCreateDataSchema,
  RelationTagMembersSchema,
  RelationTagMutationResponseSchema,
  RelationTagsSchema,
  RelationUpTagsSchema,
} from "./relation-tags.schema";
import type {
  CreateRelationTagInput,
  CreateRelationTagResult,
  DeleteRelationTagInput,
  RelationTag,
  RelationTagAccount,
  RelationTagMembersKey,
  RelationTagRequest,
  RelationTagRequestDependencies,
  RelationTagsKey,
  RelationUpTagsKey,
  SpecialFollowUpsKey,
  RenameRelationTagInput,
  SetUpRelationTagsInput,
} from "./relation-tags.types";

export const RELATION_TAG_MEMBERS_PAGE_SIZE = 50;
/** 特别关注（内置分组）。 */
export const RELATION_TAG_SPECIAL_ID = -10;
/** 默认分组（内置分组）。 */
export const RELATION_TAG_DEFAULT_ID = 0;

const RELATION_TAG_MUTATION_TIMEOUT = 15000;
/** 特别关注的分组人数上限很小，这里只做防御性限制，避免异常响应导致无限翻页。 */
const RELATION_TAG_MEMBERS_MAX_PAGES = 20;
const RELATION_TAG_CREATE_URL = "https://api.bilibili.com/x/relation/tag/create";
const RELATION_TAG_UPDATE_URL = "https://api.bilibili.com/x/relation/tag/update";
const RELATION_TAG_DELETE_URL = "https://api.bilibili.com/x/relation/tag/del";
const RELATION_TAG_ADD_USERS_URL = "https://api.bilibili.com/x/relation/tags/addUsers";

export class RelationTagLoginRequiredError extends LoginRequiredError {}
export class RelationTagResultUnknownError extends Error {}

export function getRelationTagsKey(account: RelationTagAccount): RelationTagsKey {
  return ["bilibili-relation-tags", account.mid, account.generation];
}

export function getRelationTagMembersKey(
  account: RelationTagAccount,
  tagid: number | undefined,
  pageIndex: number,
  previousPage: UpInfo[] | null,
): RelationTagMembersKey | null {
  // tagid 为 0 时是「默认分组」，不能当作缺省值跳过。
  if (tagid === undefined) {
    return null;
  }
  if (previousPage && previousPage.length < RELATION_TAG_MEMBERS_PAGE_SIZE) {
    return null;
  }
  return [
    "bilibili-relation-tag-members",
    account.mid,
    account.generation,
    tagid,
    pageIndex + 1,
  ];
}

export function getRelationUpTagsKey(account: RelationTagAccount, mid: string | number) {
  return [
    "bilibili-up-relation-tags",
    account.mid,
    account.generation,
    String(mid),
  ] as RelationUpTagsKey;
}

export function getSpecialFollowUpsKey(account: RelationTagAccount): SpecialFollowUpsKey {
  return ["bilibili-special-follow-ups", account.mid, account.generation];
}

/** 关注页展示的分组：特别关注 → 默认分组 → 自定义分组（保持接口顺序）。 */
export function getFollowGroupTags(tags: RelationTag[]) {
  const special = tags.filter((tag) => tag.tagid === RELATION_TAG_SPECIAL_ID);
  const fallback = tags.filter((tag) => tag.tagid === RELATION_TAG_DEFAULT_ID);
  const custom = tags.filter((tag) => tag.tagid > 0);
  return [...special, ...fallback, ...custom];
}

/** 「设置分组」弹窗可选的分组：特别关注 + 自定义分组。 */
export function getSelectableRelationTags(tags: RelationTag[]) {
  return tags.filter((tag) => tag.tagid === RELATION_TAG_SPECIAL_ID || tag.tagid > 0);
}

function toUpInfo(member: {
  mid: number;
  uname: string;
  face: string;
  sign: string;
}): UpInfo {
  return {
    mid: member.mid,
    name: member.uname,
    face: member.face,
    sign: member.sign,
  };
}

async function withAccountGuard<T>(work: () => Promise<T>, isCurrentAccount: () => boolean) {
  function assertCurrent() {
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  try {
    const result = await work();
    assertCurrent();
    return result;
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export async function fetchBilibiliRelationTags(
  _account: RelationTagAccount,
  request: RelationTagRequest,
  isCurrentAccount: () => boolean,
) {
  const data = await withAccountGuard(() => request("/x/relation/tags"), isCurrentAccount);
  return RelationTagsSchema.parse(data);
}

export async function fetchBilibiliRelationTagMembers(
  tagid: number,
  page: number,
  request: RelationTagRequest,
  isCurrentAccount: () => boolean,
) {
  const url = `/x/relation/tag?tagid=${tagid}&pn=${page}&ps=${RELATION_TAG_MEMBERS_PAGE_SIZE}`;
  const data = await withAccountGuard(() => request(url), isCurrentAccount);
  return RelationTagMembersSchema.parse(data).map(toUpInfo);
}

/** 「特别关注」的完整成员列表，用于全部列表的排序与高亮。 */
export async function fetchAllBilibiliRelationTagMembers(
  tagid: number,
  request: RelationTagRequest,
  isCurrentAccount: () => boolean,
) {
  const result: UpInfo[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= RELATION_TAG_MEMBERS_MAX_PAGES; page += 1) {
    const members = await fetchBilibiliRelationTagMembers(tagid, page, request, isCurrentAccount);
    for (const member of members) {
      const mid = String(member.mid);
      if (!seen.has(mid)) {
        seen.add(mid);
        result.push(member);
      }
    }
    if (members.length < RELATION_TAG_MEMBERS_PAGE_SIZE) {
      break;
    }
  }
  return result;
}

export async function fetchBilibiliUpRelationTags(
  mid: string | number,
  request: RelationTagRequest,
  isCurrentAccount: () => boolean,
) {
  const url = `/x/relation?fid=${encodeURIComponent(String(mid))}`;
  const data = await withAccountGuard(() => request(url), isCurrentAccount);
  return RelationUpTagsSchema.parse(data).tag;
}

function assertCustomTagId(tagid: number) {
  if (!Number.isSafeInteger(tagid) || tagid <= 0) {
    throw new Error("分组 ID 无效，请刷新分组后重试");
  }
}

type RelationTagMutationRequest = {
  account: RelationTagAccount;
  dependencies: RelationTagRequestDependencies;
  /** 用于错误文案的动作名，例如「创建分组」 */
  action: string;
  url: string;
  body: (csrf: string) => URLSearchParams;
};

async function runRelationTagMutation({
  account,
  dependencies,
  action,
  url,
  body,
}: RelationTagMutationRequest) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new RelationTagLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new RelationTagLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": UA,
    origin: "https://www.bilibili.com",
    referer: "https://space.bilibili.com",
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RELATION_TAG_MUTATION_TIMEOUT);
  let receivedResult = false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(url, headers, cookie),
      credentials: "omit",
      body: body(csrf).toString(),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = RelationTagMutationResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("响应格式异常");
    }
    receivedResult = true;
    const { code, message, data } = parsed.data;
    if (isBilibiliAuthExpiredCode(code)) {
      throw reportBilibiliAuthExpired(code, message, url);
    }
    if (code !== 0) {
      throw new Error(`${action}失败（${code}）：${message || "请稍后重试"}`);
    }
    return data;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new RelationTagResultUnknownError(
        controller.signal.aborted
          ? `${action}超时，请刷新分组确认结果`
          : `无法确认${action}结果，请刷新分组确认`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createBilibiliRelationTag(
  { account, name }: CreateRelationTagInput,
  dependencies: RelationTagRequestDependencies,
): Promise<CreateRelationTagResult> {
  const data = await runRelationTagMutation({
    account,
    dependencies,
    action: "创建分组",
    url: RELATION_TAG_CREATE_URL,
    body: (csrf) => new URLSearchParams({ tag: name, csrf }),
  });
  const parsed = RelationTagCreateDataSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("创建分组结果异常，请刷新分组确认");
  }
  return parsed.data;
}

export async function renameBilibiliRelationTag(
  { account, tagid, name }: RenameRelationTagInput,
  dependencies: RelationTagRequestDependencies,
) {
  assertCustomTagId(tagid);
  await runRelationTagMutation({
    account,
    dependencies,
    action: "修改分组名称",
    url: RELATION_TAG_UPDATE_URL,
    body: (csrf) => new URLSearchParams({ tagid: String(tagid), name, csrf }),
  });
}

export async function deleteBilibiliRelationTag(
  { account, tagid }: DeleteRelationTagInput,
  dependencies: RelationTagRequestDependencies,
) {
  assertCustomTagId(tagid);
  await runRelationTagMutation({
    account,
    dependencies,
    action: "删除分组",
    url: RELATION_TAG_DELETE_URL,
    body: (csrf) => new URLSearchParams({ tagid: String(tagid), csrf }),
  });
}

export async function setBilibiliUpRelationTags(
  { account, mid, tagids }: SetUpRelationTagsInput,
  dependencies: RelationTagRequestDependencies,
) {
  const fid = String(mid);
  if (!/^[1-9]\d*$/.test(fid) || !Number.isSafeInteger(Number(fid))) {
    throw new Error("UP 主 ID 无效");
  }
  // B站 不接受空 tagids；弹窗清空可选分组时，将 UP 移回内置的默认分组。
  const submittedTagids = tagids.length ? tagids : [RELATION_TAG_DEFAULT_ID];
  await runRelationTagMutation({
    account,
    dependencies,
    action: "设置分组",
    url: RELATION_TAG_ADD_USERS_URL,
    body: (csrf) =>
      new URLSearchParams({ fids: fid, tagids: submittedTagids.join(","), csrf }),
  });
}
