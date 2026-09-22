import type { ReactNode } from "react";

import type { DynamicItem } from "@/api/dynamic-items.type";

export type DynamicListProps = {
  list: DynamicItem[];
  error?: Error;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isReachingEnd: boolean;
  emptyTitle: string;
  emptyMessage: string;
  errorTitle?: string;
  listHeader?: ReactNode;
  showActions?: boolean;
  refresh: () => void | Promise<unknown>;
  loadMore: () => void | Promise<unknown>;
  retry: () => void | Promise<unknown>;
  onItemPress: (item: DynamicItem) => void;
  onTabReselect?: () => void;
};
