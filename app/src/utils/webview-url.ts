import { Linking } from "react-native";

/**
 * WebView 里允许站内跳转的域名。页面本身、接口、直播与视频 CDN 都必须在列表里，
 * 否则站内功能会因为跳转被拦而断链。
 */
const BILIBILI_HOSTS = [
  "bilibili.com",
  "b23.tv",
  "bilivideo.com",
  "bilivideo.cn",
  "hdslb.com",
  "biliapi.net",
] as const;

function getHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isBilibiliHost(url: string) {
  const hostname = getHostname(url);
  return BILIBILI_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export function isHttpUrl(url: string) {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** 用系统浏览器打开站外链接；非 http(s)（如 bilibili://）不交给系统，避免乱唤起 App。 */
export function openInSystemBrowser(url: string) {
  if (!isHttpUrl(url)) {
    return;
  }
  void Linking.openURL(url).catch(() => {});
}

/**
 * WebView 的导航白名单：只允许 B站域名在主框架里加载，
 * 站外 http(s) 链接交给系统浏览器，其余（自定义 scheme、about:、data: 等）一律拦截。
 * `isTopFrame` 只有新版本 WebView 才上报，取不到时按主框架处理，安全优先。
 */
export function shouldAllowWebViewRequest(request: { url: string; isTopFrame?: boolean }) {
  if (isBilibiliHost(request.url)) {
    return true;
  }
  // 只拦主框架；子框架/资源请求保持原行为，避免误伤 B站页面的广告位与播放器。
  if (request.isTopFrame === false) {
    return true;
  }
  if (isHttpUrl(request.url)) {
    openInSystemBrowser(request.url);
  }
  return false;
}
