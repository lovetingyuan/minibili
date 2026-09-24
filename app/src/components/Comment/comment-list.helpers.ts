export function getCommentListEmptyText(commentCount: number | undefined, error: unknown) {
  if (commentCount === 0) {
    return "还没有评论";
  }
  return error ? "评论已关闭或加载失败" : "还没有评论";
}
