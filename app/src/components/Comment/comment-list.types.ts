import type React from "react";

export type CommentListHeaderRenderProps = {
  openComposer: () => void;
};

export type CommentListProps = {
  children?: React.ReactNode | ((props: CommentListHeaderRenderProps) => React.ReactNode);
  commentId: string | number;
  commentCount?: number;
  commentType: number;
  sourceUrl: string;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  dividerRight?: React.ReactNode;
};
