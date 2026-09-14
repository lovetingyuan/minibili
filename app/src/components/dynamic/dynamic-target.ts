import type { DynamicItem } from "@/api/dynamic-items.type";
import type { RootStackParamList, UpInfo } from "@/types";

/** 视频类型的动态没有独立详情页，直接在播放页打开。 */
export function getDynamicVideoTarget(item: DynamicItem): RootStackParamList["Play"] | null {
  const { content } = item;
  if (content.kind !== "video" || !content.bvid) {
    return null;
  }
  return {
    bvid: content.bvid,
    aid: content.aid,
    title: content.title,
    desc: content.description,
    cover: content.cover,
    mid: item.author.mid,
    name: item.author.name,
    face: item.author.face,
  };
}

export function getDynamicDetailTarget(
  item: DynamicItem,
  user?: Pick<UpInfo, "mid" | "name">,
): RootStackParamList["DynamicDetail"] {
  return {
    dynamicId: item.id,
    title: item.text.slice(0, 24) || "动态详情",
    user: user ?? { mid: item.author.mid, name: item.author.name },
  };
}
