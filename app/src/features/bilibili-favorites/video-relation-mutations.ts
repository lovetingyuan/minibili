import { bilibiliSession } from "../bilibili-session/session";
import { createFavoriteMutations } from "./mutations";

// 点赞、收藏共用关系缓存，写入必须串行，避免 SWR 丢弃较早的成功结果。
export const videoRelationMutations = createFavoriteMutations(
  bilibiliSession.isCurrentAccount,
  "视频操作正在进行，请稍候",
);
