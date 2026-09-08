import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { mapDynamicItem } from "./dynamic-items.mapper";
import { DynamicListResponseSchema } from "./dynamic-items.schema";
import { FollowingDynamicsUpdateCountSchema } from "./following-dynamics-update.schema";
import type {
  FollowingDynamicsAccount,
  FollowingDynamicsKey,
  FollowingDynamicsListItem,
  FollowingDynamicsPage,
  FollowingDynamicsRequest,
  FollowingDynamicsUpdatePage,
} from "./following-dynamics.types";

const FOLLOWING_DYNAMIC_FEATURES = [
  "itemOpusStyle",
  "listOnlyfans",
  "opusBigCover",
  "onlyfansVote",
  "decorationCard",
  "onlyfansAssetsV2",
  "forwardListHidden",
  "ugcDelete",
  "onlyfansQaCard",
  "commentsNewVersion",
  "avatarAutoTheme",
  "sunflowerStyle",
  "cardsEnhance",
  "eva3CardOpus",
  "eva3CardVideo",
  "eva3CardComment",
  "eva3CardVote",
  "eva3CardUser",
].join(",");

const FOLLOWING_DYNAMIC_DEVICE = JSON.stringify({
  platform: "web",
  device: "pc",
  spmid: "333.1365",
});

export function buildFollowingDynamicsUrl(page = 1, offset = "") {
  const params = new URLSearchParams({
    timezone_offset: "-480",
    type: "all",
    platform: "web",
    page: String(page),
    features: FOLLOWING_DYNAMIC_FEATURES,
    "x-bili-device-req-json": FOLLOWING_DYNAMIC_DEVICE,
  });
  if (offset) params.set("offset", offset);
  return `/x/polymer/web-dynamic/v1/feed/all?${params}`;
}

export function buildFollowingDynamicsUpdateUrl(updateBaseline = "") {
  const params = new URLSearchParams({
    type: "all",
  });
  if (updateBaseline) params.set("update_baseline", updateBaseline);
  return `/x/polymer/web-dynamic/v1/feed/all/update?${params}`;
}

export function getFollowingDynamicsKey(
  account: FollowingDynamicsAccount | null,
  index: number,
  previous: FollowingDynamicsPage | null,
): FollowingDynamicsKey | null {
  if (
    !account ||
    (index > 0 && (!previous || !previous.has_more || !previous.items.length || !previous.offset))
  ) {
    return null;
  }
  return [
    "bilibili-following-dynamics",
    account.mid,
    account.generation,
    index + 1,
    index === 0 ? "" : previous!.offset!,
  ];
}

export async function fetchFollowingDynamicsPage(
  page: number,
  offset: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsUrl(page, offset));
    assertCurrent();
    return DynamicListResponseSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export async function fetchFollowingDynamicsUpdateCount(
  updateBaseline: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsUpdateUrl(updateBaseline));
    assertCurrent();
    return FollowingDynamicsUpdateCountSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export function getFollowingDynamicsUpdateCount(data: FollowingDynamicsUpdatePage) {
  const count = Number(data.update_num ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.min(count, 99) : 0;
}

export function getFollowingDynamicsLatestId(page: FollowingDynamicsPage | undefined) {
  if (page?.items[0]?.id_str != null) {
    return String(page.items[0].id_str);
  }
  return page?.update_baseline ?? null;
}

export function getFollowingDynamicsListItems(pages: FollowingDynamicsPage[]) {
  const seen = new Set<string>();
  const items: FollowingDynamicsListItem[] = [];
  for (const page of pages) {
    for (const rawItem of page.items) {
      const item = mapDynamicItem(rawItem);
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}
