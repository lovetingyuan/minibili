export type SpaceTabKey = "dynamic" | "video" | "opus";

export type SpaceTab = {
  key: SpaceTabKey;
  label: string;
  count?: number;
};

export type SpaceTabsProps = {
  tabs: readonly SpaceTab[];
  selectedKey: SpaceTabKey;
  onSelect: (key: SpaceTabKey) => void;
};
