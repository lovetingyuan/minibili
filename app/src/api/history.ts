import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { getProgressRatio } from "../utils/watch-progress";
import { HistoryResponseSchema } from "./history.schema";
import type {
  HistoryAccount,
  HistoryCursor,
  HistoryKey,
  HistoryListItem,
  HistoryPage,
  HistoryRequest,
} from "./history.types";

/** 历史接口单页条数：实测 ps 上限为 30，超过会返回 -400，这里沿用列表页的 20 */
export const HISTORY_PAGE_SIZE = 20;
export const INITIAL_HISTORY_CURSOR: HistoryCursor = { max: 0, view_at: 0, business: "" };
let nextChainId = 0;

export function getHistoryKey(
  account: HistoryAccount | null,
  index: number,
  previous: HistoryPage | null,
): HistoryKey | null {
  if (!account || (index > 0 && (!previous || !previous.hasMore))) {
    return null;
  }
  const cursor = index === 0 ? INITIAL_HISTORY_CURSOR : previous!.cursor;
  return [
    "bilibili-history",
    account.mid,
    account.generation,
    String(cursor.max),
    cursor.view_at,
    cursor.business,
    index === 0 ? 0 : previous!.chainId,
  ];
}

export async function fetchBilibiliHistory(
  cursor: HistoryCursor,
  request: HistoryRequest,
  isCurrentAccount: () => boolean,
  chainId = 0,
  pageSize = HISTORY_PAGE_SIZE,
): Promise<HistoryPage> {
  function assertCurrent() {
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const params = new URLSearchParams({
    max: String(cursor.max),
    view_at: String(cursor.view_at),
    business: cursor.business,
    ps: String(pageSize),
    type: "archive",
  });
  try {
    const data = await request(`/x/web-interface/history/cursor?${params}`);
    assertCurrent();
    const page = HistoryResponseSchema.parse(data);
    const advanced =
      String(page.cursor.max) !== String(cursor.max) ||
      page.cursor.view_at !== cursor.view_at ||
      page.cursor.business !== cursor.business;
    return {
      ...page,
      hasMore: page.list.length > 0 && advanced,
      // 每次成功重取首屏，都为后续页创建新缓存链，即使首屏游标没有变化。
      chainId: chainId || ++nextChainId,
    };
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export function getHistoryListItems(pages: HistoryPage[]): HistoryListItem[] {
  const seen = new Set<string>();
  const items: HistoryListItem[] = [];
  for (const page of pages) {
    for (const record of page.list) {
      const { history } = record;
      if (history.business !== "archive") {
        continue;
      }
      const bvid = history.bvid?.trim();
      const key = `${history.oid || bvid || record.title}:${history.cid || history.page || 0}:${record.view_at}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({
        key,
        title: record.title || "不可用的视频",
        watchedAt: record.view_at,
        progressRatio: getProgressRatio(
          record.progress ?? 0,
          record.duration ?? 0,
          record.is_finish === 1,
        ),
        video: bvid
          ? {
              bvid,
              aid: history.oid ?? undefined,
              title: record.title || "未命名视频",
              cover: record.cover ?? "",
              duration: record.duration ?? 0,
              mid: record.author_mid ?? 0,
              name: record.author_name || "未知UP主",
              face: record.author_face ?? "",
            }
          : null,
      });
    }
  }
  return items;
}
