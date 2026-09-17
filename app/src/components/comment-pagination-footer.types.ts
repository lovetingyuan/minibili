export type CommentPaginationFooterProps = {
  error: unknown;
  hasItems: boolean;
  isPageEnd: boolean;
  isValidating: boolean;
  noun: "评论" | "回复";
  onRetry: () => void;
};
