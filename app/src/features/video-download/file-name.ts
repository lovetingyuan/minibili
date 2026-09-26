const UnsafeFileNameCharacter = /[\\/:*?"<>|]/g;
const UnsupportedFileNameEnding = /[\s._-]+$/;
const MaxFileNameLength = 120;

/**
 * 清洗文件名：去掉文件系统不支持的字符与结尾的点/空格。
 */
export function sanitizeFileName(name: string) {
  return name
    .replace(UnsafeFileNameCharacter, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(UnsupportedFileNameEnding, "")
    .slice(0, MaxFileNameLength)
    .trim();
}

/**
 * 相册里的视频文件名：单P 用标题，多P 追加 "-p{序号}"。
 */
export function buildVideoFileName(input: { title?: string; page?: number; bvid?: string }) {
  const { title, page = 1, bvid } = input;
  const base = sanitizeFileName(title ?? "") || `minibili-${bvid || Date.now().toString(36)}`;
  return page > 1 ? `${base}-p${page}.mp4` : `${base}.mp4`;
}

/**
 * 通知标题：多P 视频带上分P 信息，方便在通知栏区分。
 */
export function buildVideoDownloadTitle(input: {
  title?: string;
  page?: number;
  pageTitle?: string;
}) {
  const { title, page = 1, pageTitle } = input;
  const base = sanitizeFileName(title ?? "") || "视频";
  if (page <= 1) {
    return base;
  }
  const pageName = sanitizeFileName(pageTitle ?? "");
  return pageName ? `${base} · P${page} ${pageName}` : `${base} · P${page}`;
}
