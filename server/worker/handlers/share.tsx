import {
  fetchVideoInfo,
  VideoNotFoundError,
  VIDEO_INFO_CACHE_SECONDS,
} from "../services/bilibili-video";
import { buildShareSearch, normalizePage, parseShareParams } from "../share/format";
import { ShareErrorPage, SharePage } from "../share/page";
import type { AppContext } from "../types";
import { getClientIp, isRateLimited, RATE_LIMIT_RETRY_AFTER } from "../utils/rate-limit";

/**
 * canonical 与 og:url 使用固定站点，不用请求 Host：Host 头可被伪造，
 * 不该出现在直出的元信息里。
 */
const SITE_ORIGIN = "https://minibili.tingyuan.in";

/** 分享页整页直出：视频信息在服务端取好，失败时只返回精简错误页。 */
export async function handleSharePage(c: AppContext) {
  const url = new URL(c.req.url);
  const params = parseShareParams(url.search);

  if (!params) {
    c.header("Cache-Control", "no-store");
    return c.html(
      <ShareErrorPage
        title="缺少视频参数"
        message="请确认分享链接中包含正确的 bvid，例如 /share?bvid=BV1XctB6PEuZ&p=1"
        retryHref="/share"
        showSiteLink
      />,
      400,
    );
  }

  // 随机 bvid 会绕过 300 秒缓存直接打上游，这里按 IP 挡掉抓取式流量。
  if (await isRateLimited(c.env.RATE_LIMIT_SHARE, "share", getClientIp(c))) {
    c.header("Cache-Control", "no-store");
    c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
    return c.html(
      <ShareErrorPage
        title="访问过于频繁"
        message="短时间内打开的分享页过多，请稍后再试。"
        retryHref={`/share${buildShareSearch(params.bvid, params.page)}`}
      />,
      429,
    );
  }

  try {
    const data = await fetchVideoInfo(c.env, params.bvid, params.page);
    const page = normalizePage(data.currentPage, data.pages.length);
    c.header("Cache-Control", `public, max-age=${VIDEO_INFO_CACHE_SECONDS}`);
    return c.html(<SharePage data={data} page={page} origin={SITE_ORIGIN} />, 200);
  } catch (error) {
    c.header("Cache-Control", "no-store");
    const retryHref = `/share${buildShareSearch(params.bvid, params.page)}`;
    if (error instanceof VideoNotFoundError) {
      return c.html(
        <ShareErrorPage
          title="视频不存在或已被删除"
          message="请确认分享链接中的 bvid 是否正确，视频可能已被删除或设为不可见。"
          retryHref={retryHref}
        />,
        404,
      );
    }
    return c.html(
      <ShareErrorPage
        title="视频信息加载失败"
        message="接口暂时不可用，请稍后重试。"
        retryHref={retryHref}
      />,
      502,
    );
  }
}

/** /share.html 保留旧链接：307 到 /share 并带上原有查询串。 */
export function handleShareHtmlRedirect(c: AppContext) {
  const url = new URL(c.req.url);
  c.header("Cache-Control", "no-store");
  return c.redirect(`/share${url.search}`, 307);
}
