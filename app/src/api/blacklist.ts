import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import type { UpInfo } from "../types";
import { BlacklistDataSchema } from "./blacklist.schema";
import type { Blacklist, BlacklistFetcher, BlacklistKey } from "./blacklist.types";
import fetcher from "./fetcher";

const PAGE_SIZE = 20;

export function getBlacklistKey(mid: string, generation: number): BlacklistKey {
  return ["bilibili-blacklist", mid, generation];
}

export async function fetchBilibiliBlacklist(
  request: BlacklistFetcher = fetcher,
  shouldContinue: () => boolean = () => true,
): Promise<Blacklist> {
  const blacklist = new Map<string, UpInfo>();
  let total = Infinity;
  let version: number | undefined;
  let page = 1;

  while (blacklist.size < total) {
    if (!shouldContinue()) throw new BilibiliSessionChangedError();
    const query = new URLSearchParams({
      re_version: String(version ?? 0),
      pn: String(page),
      ps: String(PAGE_SIZE),
      jsonp: "jsonp",
      web_location: "333.33",
      "x-bili-redirect": "1",
    });
    const payload = await request(`/x/relation/blacks?${query}`);
    if (!shouldContinue()) throw new BilibiliSessionChangedError();
    const data = BlacklistDataSchema.parse(payload);
    if (version !== undefined && (data.total !== total || data.re_version !== version)) {
      throw new Error("B站黑名单发生变化，请重新同步");
    }
    total = data.total;
    version = data.re_version;
    for (const item of data.list) {
      blacklist.set(String(item.mid), {
        mid: item.mid,
        name: item.uname,
        face: item.face,
        sign: item.sign,
      });
    }
    if (data.list.length === 0 || page * PAGE_SIZE >= total) break;
    page += 1;
  }

  if (blacklist.size !== total) throw new Error("B站黑名单不完整，请重新同步");
  return blacklist;
}
