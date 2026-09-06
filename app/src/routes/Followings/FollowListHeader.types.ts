import type { HeaderSearchBarRef } from "@react-navigation/elements";
import type { RefObject } from "react";

export type FollowListHeaderProps = {
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: (text: string) => void;
  searchActive: boolean;
  searchBarRef: RefObject<HeaderSearchBarRef | null>;
  title: string;
};
