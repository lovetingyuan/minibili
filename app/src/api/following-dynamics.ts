import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { mapDynamicItem } from "./dynamic-items.mapper";
import { DynamicListResponseSchema } from "./dynamic-items.schema";
import { FollowingDynamicsNavResponseSchema } from "./following-dynamics-nav.schema";
import type {
  FollowingDynamicsAccount,
  FollowingDynamicsKey,
  FollowingDynamicsListItem,
  FollowingDynamicsNavPage,
  FollowingDynamicsPage,
  FollowingDynamicsRequest,
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
    web_location: "333.1365",
    "x-bili-device-req-json": FOLLOWING_DYNAMIC_DEVICE,
  });
  if (offset) params.set("offset", offset);
  return `/x/polymer/web-dynamic/v1/feed/all?${params}`;
}

export function buildFollowingDynamicsNavUrl(updateBaseline = "", offset = "") {
  const params = new URLSearchParams({
    web_location: "333.1007",
  });
  if (updateBaseline) params.set("update_baseline", updateBaseline);
  if (offset) params.set("offset", offset);
  return `/x/polymer/web-dynamic/v1/feed/nav?${params}`;
}

export function getFollowingDynamicsKey(
  account: FollowingDynamicsAccount | null,
  index: number,
  previous: FollowingDynamicsPage | null,
): FollowingDynamicsKey | null {
  if (
    !account ||
    (index > 0 &&
      (!previous || !previous.has_more || !previous.items.length || !previous.offset))
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

export async function fetchFollowingDynamicsNav(
  updateBaseline: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsNavUrl(updateBaseline));
    assertCurrent();
    return FollowingDynamicsNavResponseSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export function getFollowingDynamicsNavBaseline(data: FollowingDynamicsNavPage) {
  return data.update_baseline || String(data.items[0]?.id_str ?? "");
}

export function getFollowingDynamicsNavCount(data: FollowingDynamicsNavPage) {
  const count = Number(data.update_num ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.min(count, 99) : 0;
}

export function getFollowingDynamicsNavState(
  existingBaseline: string | undefined,
  data: FollowingDynamicsNavPage,
) {
  if (!existingBaseline) {
    return {
      baseline: getFollowingDynamicsNavBaseline(data),
      count: 0,
    };
  }
  return {
    baseline: existingBaseline,
    count: getFollowingDynamicsNavCount(data),
  };
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
