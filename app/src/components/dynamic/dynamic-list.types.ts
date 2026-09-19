import type { ReactNode } from "react";

import type { DynamicItem } from "@/api/dynamic-items.type";

export type DynamicListProps = {
  list: DynamicItem[];
  error?: Error;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isReachingEnd: boolean;
  loadingText: string;
  emptyTitle: string;
  emptyMessage: string;
  listHeader?: ReactNode;
  refresh: () => void | Promise<unknown>;
  loadMore: () => void | Promise<unknown>;
  retry: () => void | Promise<unknown>;
  onItemPress: (item: DynamicItem) => void;
  onTabReselect?: () => void;
};
