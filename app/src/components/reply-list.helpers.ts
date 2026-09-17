import type { RepliesInfo } from "@/store/replies-info.type";

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
