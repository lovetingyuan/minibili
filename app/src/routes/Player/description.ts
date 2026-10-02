/** 简介超过该字数时折叠，并显示“显示更多” */
export const VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS = 100;

/** 折叠状态下简介最多展示的行数，“显示更多”会跟在最后一行行尾 */
export const VIDEO_DESCRIPTION_COLLAPSED_LINES = 4;

/**
 * 清洗接口返回的简介：
 * B 站无简介时会返回 "-"，部分视频的简介就是标题本身，这两种情况都不展示。
 */
export function getVideoDescription(
  desc: string | null | undefined,
  title: string | null | undefined,
): string {
  if (!desc || desc === "-") {
    return "";
  }
  if (desc === title) {
    return "";
  }
  return desc;
}

/** 按用户可见字符数统计，emoji 等代理对算一个字符 */
export function countVideoDescriptionChars(text: string): number {
  return Array.from(text).length;
}

export function shouldCollapseDescription(text: string): boolean {
  return countVideoDescriptionChars(text) > VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS;
}
