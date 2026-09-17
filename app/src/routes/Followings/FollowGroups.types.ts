import type { ReactElement } from "react";

import type { RelationTag } from "@/api/relation-tags.types";
import type { UpInfo } from "@/types";

export type FollowGroupTab = {
  key: string;
  /** null 表示「全部关注」，成员来自本地同步的关注列表 */
  tagid: number | null;
  name: string;
  count: number;
  /** 只有自定义分组支持重命名与删除 */
  custom: boolean;
};

export type FollowGroupTabsProps = {
  tabs: FollowGroupTab[];
  selectedKey: string;
  disabled: boolean;
  onSelect: (tab: FollowGroupTab) => void;
  onLongPress: (tab: FollowGroupTab) => void;
  onCreate: () => void;
};

export type FollowUpsGridProps = {
  ups: UpInfo[];
  /** 特别关注的 UP：名称高亮，并在排序时排到最前 */
  specialMids?: ReadonlySet<string>;
  onSetGroups?: (up: UpInfo) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  emptyContent: ReactElement;
  footer: ReactElement | null;
};

export type FollowGroupEditorState =
  | { mode: "create" }
  | { mode: "rename"; tagid: number; name: string };

export type GroupNameDialogProps = {
  mode: "create" | "rename";
  initialName?: string;
  saving: boolean;
  error: Error | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export type SetUpGroupDialogProps = {
  up: UpInfo;
  groups: RelationTag[];
  onClose: () => void;
  onSubmit: (tagids: number[]) => Promise<void>;
  onLoginRequired: (error: Error) => void;
};
