import useSWR from "swr";

import type { UpInfo } from "@/types";

import fetcher from "./fetcher";
import { FollowingsDataSchema } from "./followings.schema";
import type { FollowingItem } from "./followings.schema";
import type { FollowingsFetcher, FollowingsKey } from "./followings.types";

const FOLLOWINGS_PAGE_SIZE = 24;

export class FollowingsCancelledError extends Error {
  constructor() {
    super("关注列表同步已取消");
  }
}

function getFollowingUrl(vmid: string, page: number) {
  return `/x/relation/followings?order=desc&order_type=&vmid=${encodeURIComponent(vmid)}&pn=${page}&ps=${FOLLOWINGS_PAGE_SIZE}&gaia_source=main_web&web_location=333.1387`;
}

function toUpInfo(item: FollowingItem): UpInfo {
  return {
    mid: item.mid,
    name: item.uname,
    face: item.face,
    sign: item.sign,
  };
}

export async function fetchBilibiliFollowings(
  vmid: string,
  request: FollowingsFetcher = fetcher,
  shouldContinue: () => boolean = () => true,
) {
  const result: UpInfo[] = [];
  const seenMids = new Set<string>();
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (result.length < total) {
    if (!shouldContinue()) {
      throw new FollowingsCancelledError();
    }
    const payload = await request(getFollowingUrl(vmid, page));
    if (!shouldContinue()) {
      throw new FollowingsCancelledError();
    }
    const data = FollowingsDataSchema.parse(payload);
    if (Number.isFinite(total) && data.total !== total) {
      throw new Error("B站关注数量发生变化，请重新同步");
    }
    total = data.total;

    for (const item of data.list) {
      const mid = item.mid.toString();
      if (!seenMids.has(mid)) {
        seenMids.add(mid);
        result.push(toUpInfo(item));
      }
    }

    if (data.list.length === 0 || page * FOLLOWINGS_PAGE_SIZE >= total) {
      break;
    }
    page += 1;
  }

  if (result.length !== total) {
    throw new Error("B站关注列表不完整，请重新同步");
  }
  return result;
}

export function mergeFollowedUps(localUps: UpInfo[], importedUps: UpInfo[]) {
  const seenMids = new Set<string>();
  const merged: UpInfo[] = [];

  for (const importedUp of importedUps) {
    const mid = importedUp.mid.toString();
    if (!seenMids.has(mid)) {
      seenMids.add(mid);
      merged.push({ ...importedUp });
    }
  }

  const unchanged =
    merged.length === localUps.length &&
    merged.every((up, index) => {
      const local = localUps[index];
      return (
        up.mid.toString() === local.mid.toString() &&
        up.name === local.name &&
        up.face === local.face &&
        up.sign === local.sign
      );
    });
  return unchanged ? localUps : merged;
}

export function getFollowingsKey(vmid: string, generation: number): FollowingsKey {
  return ["bilibili-followings", vmid, generation];
}

export function useBilibiliFollowings(
  vmid?: string,
  syncVersion = 0,
  shouldContinue?: () => boolean,
) {
  return useSWR(
    vmid ? getFollowingsKey(vmid, syncVersion) : null,
    ([, currentVmid]) => fetchBilibiliFollowings(currentVmid, fetcher, shouldContinue),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: (error) => !(error instanceof FollowingsCancelledError),
    },
  );
}
