import type { UserNavType } from "./user-nav.schema";

//https://api.bilibili.com/x/web-interface/nav
const NAV_URL = "/x/web-interface/nav";
/** wbi 的 img/sub key 由 B站 定期轮换，缓存一小时足够新；到期后下次调用重新拉取 */
const WBI_CACHE_MS = 60 * 60 * 1000;

type WbiImg = UserNavType["wbi_img"];

/**
 * 缓存的是「进行中的请求」而不是「已经拿到的结果」：首屏多个 wbi 请求并发时
 * 只会真正打一次 nav。
 *
 * nav 无论登没登录都会返回 wbi_img，所以这里不看登录态，只负责把 key 取回来。
 * 真没拿到 key（网络/解析异常）时丢弃缓存，等下次调用重试。
 */
let wbiImgCache: { expiresAt: number; promise: Promise<WbiImg> } | null = null;

export function getWBIInfo(request: (url: string) => Promise<UserNavType>): Promise<WbiImg> {
  const cached = wbiImgCache;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.promise;
  }

  const promise = request(NAV_URL).then((data) => data.wbi_img);

  wbiImgCache = { expiresAt: Date.now() + WBI_CACHE_MS, promise };
  promise.catch(() => {
    if (wbiImgCache?.promise === promise) {
      wbiImgCache = null;
    }
  });

  return promise;
}

/** 登录态变了就得重新取 key：登录成功后清掉缓存，下一次 wbi 请求重新打 nav */
export function clearWBIInfoCache() {
  wbiImgCache = null;
}
