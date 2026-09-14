import {
  fetchVideoInfo,
  VideoNotFoundError,
  VIDEO_INFO_CACHE_SECONDS,
} from "../services/bilibili-video";
import { buildShareSearch, normalizePage, parseShareParams } from "../share/format";
import { ShareErrorPage, SharePage } from "../share/page";
import type { AppContext } from "../types";

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

  try {
    const data = await fetchVideoInfo(params.bvid, params.page);
    const page = normalizePage(data.currentPage, data.pages.length);
    c.header("Cache-Control", `public, max-age=${VIDEO_INFO_CACHE_SECONDS}`);
    return c.html(<SharePage data={data} page={page} origin={url.origin} />, 200);
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
