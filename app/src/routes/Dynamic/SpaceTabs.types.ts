import type { SpaceSearchTabKey } from "@/api/space-search.types";

export type SpaceTabKey = "dynamic" | "video" | "opus";

export type SpaceTab = {
  key: SpaceTabKey;
  label: string;
  count?: number;
};

type BrowseSpaceTabsProps = {
  mode: "browse";
  tabs: readonly SpaceTab[];
  selectedKey: SpaceTabKey;
  onSelect: (key: SpaceTabKey) => void;
  onOpenSearch: () => void;
};

type SearchSpaceTabsProps = {
  mode: "search";
  selectedKey: SpaceSearchTabKey;
  query: string;
  onChangeQuery: (query: string) => void;
  onSelect: (key: SpaceSearchTabKey) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export type SpaceTabsProps = BrowseSpaceTabsProps | SearchSpaceTabsProps;
