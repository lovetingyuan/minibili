import type React from "react";

export type CommentListProps = React.PropsWithChildren<{
  commentId: string | number;
  commentType: number;
  sourceUrl: string;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  dividerRight?: React.ReactNode;
}>;
