import { createFavoriteMutations } from "../bilibili-favorites/mutations";
import { bilibiliSession } from "../bilibili-session/session";

// 稍后再看的写入按账号 + 视频串行，避免重复点击或与列表同步互相覆盖。
export const watchLaterMutations = createFavoriteMutations(
  bilibiliSession.isCurrentAccount,
  "稍后再看操作正在进行，请稍候",
);
