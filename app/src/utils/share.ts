import { site } from "../constants";

const TITLE_MAX_LENGTH = 40;

/**
 * 动态 id 不是 BV 号，无法用分享页播放，继续分享对应的动态地址。
 */
export function isDynamicId(value: string | number) {
  return /^\d+$/.test(`${value}`);
}

export function buildVideoShareUrl(bvid: string | number, p = 1) {
  if (isDynamicId(bvid)) {
    return `https://m.bilibili.com/dynamic/${bvid}`;
  }
  return `${site}share?bvid=${bvid}&p=${p}`;
}

export function buildVideoShareMessage(name: string, title: string, url: string) {
  const message = title.length < TITLE_MAX_LENGTH ? title : `${title.substring(0, 40)}……`;
  return [`MiniBili - ${name}`, message, url].join("\n");
}
