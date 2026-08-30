import useSWR from "swr";

import type { UpInfo } from "@/types";

import fetcher from "./fetcher";
import { FollowingsDataSchema, type FollowingItem } from "./followings.schema";

const FOLLOWINGS_PAGE_SIZE = 24;

type FollowingsFetcher = (url: string) => Promise<unknown>;

export class FollowingsCancelledError extends Error {
  constructor() {
    super("关注列表导入已取消");
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

  return result;
}

export function mergeFollowedUps(localUps: UpInfo[], importedUps: UpInfo[]) {
  const importedByMid = new Map(importedUps.map((up) => [up.mid.toString(), up]));
  const seenMids = new Set<string>();
  const merged: UpInfo[] = [];
  let changed = false;

  for (const localUp of localUps) {
    const mid = localUp.mid.toString();
    if (seenMids.has(mid)) {
      changed = true;
      continue;
    }

    seenMids.add(mid);
    const importedUp = importedByMid.get(mid);
    if (
      importedUp &&
      (localUp.name !== importedUp.name ||
        localUp.face !== importedUp.face ||
        localUp.sign !== importedUp.sign)
    ) {
      merged.push({
        ...localUp,
        name: importedUp.name,
        face: importedUp.face,
        sign: importedUp.sign,
      });
      changed = true;
    } else {
      merged.push(localUp);
    }
  }

  for (const importedUp of importedUps) {
    const mid = importedUp.mid.toString();
    if (!seenMids.has(mid)) {
      seenMids.add(mid);
      merged.push(importedUp);
      changed = true;
    }
  }

  return changed ? merged : localUps;
}

export function useBilibiliFollowings(
  vmid?: string,
  syncVersion = 0,
  shouldContinue?: () => boolean,
) {
  return useSWR(
    vmid ? (["bilibili-followings", vmid, syncVersion] as const) : null,
    ([, currentVmid]) => fetchBilibiliFollowings(currentVmid, fetcher, shouldContinue),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: (error) => !(error instanceof FollowingsCancelledError),
    },
  );
}
