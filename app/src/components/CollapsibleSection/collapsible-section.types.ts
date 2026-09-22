import type { ReactNode } from "react";

export type CollapsibleSectionProps = {
  children: ReactNode;
  expanded: boolean;
  onPress: () => void;
  title: string;
};
