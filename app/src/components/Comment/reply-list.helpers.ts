import type { RepliesInfo } from "@/store/replies-info.type";

/**
 * 回复弹层占屏幕高度的比例。
 *
 * 键盘弹出时 sheet 靠 gorhom 的原生位移抬到键盘上方，而位移会被容器顶部截断，
 * 高度越大可上移的空间越小（86vh 时只剩约 120dp，键盘约 270dp），所以保留约六成。
 */
const REPLY_SHEET_HEIGHT_RATIO = 0.6;

export function getReplySheetHeight(windowHeight: number) {
  return Math.round(Math.max(0, windowHeight) * REPLY_SHEET_HEIGHT_RATIO);
}

export function removeReplyFromInfo(info: RepliesInfo, id: string): RepliesInfo {
  const rootComment = {
    ...info.rootComment,
    rcount: Math.max(0, info.rootComment.rcount - 1),
    replies: info.rootComment.replies.filter((reply) => reply.id !== id),
  };

  return {
    ...info,
    allCount: Math.max(0, info.allCount - 1),
    rootComment,
    previewReplies: info.previewReplies.filter((reply) => reply.id !== id),
    addedReplies: info.addedReplies.filter((reply) => reply.id !== id),
    replyTarget: info.replyTarget.id === id ? rootComment : info.replyTarget,
  };
}
