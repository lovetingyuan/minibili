import useSWRMutation from "swr/mutation";

import { bilibiliSession } from "../features/bilibili-session/session";
import type { FavoriteAccount } from "./favorites.types";
import { getBilibiliLoginCookie } from "./get-cookie";
import { DanmakuLoginRequiredError, sendVideoDanmaku } from "./send-danmaku";
import type { DanmakuSendKey, DanmakuSendResult } from "./send-danmaku.types";
import type { FavoriteVideo } from "./video-favorites.types";

function getDanmakuSendKey(
  account: FavoriteAccount,
  video: FavoriteVideo,
  cid: number,
): DanmakuSendKey {
  return ["bilibili-danmaku-send", account.mid, account.generation, video.bvid, cid];
}

/**
 * 发送视频弹幕。发送结果不需要写入缓存，只做一次写请求。
 */
export function useSendDanmaku(
  account: FavoriteAccount | null,
  video: FavoriteVideo | null,
  cid: number,
) {
  const key = account && video && cid > 0 ? getDanmakuSendKey(account, video, cid) : null;
  const { trigger, isMutating } = useSWRMutation<
    DanmakuSendResult,
    Error,
    DanmakuSendKey | null,
    { text: string; progressMs: number }
  >(
    key,
    (_key, { arg }) => {
      if (!account || !video) {
        throw new DanmakuLoginRequiredError("请先登录 B站");
      }
      return sendVideoDanmaku(
        account,
        { video, cid, text: arg.text, progressMs: arg.progressMs },
        {
          readCookie: getBilibiliLoginCookie,
          isCurrentAccount: bilibiliSession.isCurrentAccount,
        },
      );
    },
    { revalidate: false },
  );

  async function send(text: string, progressMs: number) {
    if (!key) {
      throw new DanmakuLoginRequiredError("请先登录 B站");
    }
    return trigger({ text, progressMs });
  }

  return { send, isSending: isMutating };
}
