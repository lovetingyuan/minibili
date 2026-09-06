import { useBackHandler } from "@react-native-community/hooks";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";

import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

import type { FollowListHeaderProps } from "./FollowListHeader.types";

export default function useFollowListHeader({
  onChangeText,
  onClose,
  onSubmit,
  searchActive,
  searchBarRef,
  title,
}: FollowListHeaderProps) {
  const focused = useIsFocused();
  useBackHandler(() => {
    if (!searchActive || !focused) {
      return false;
    }
    if (searchBarRef.current) {
      searchBarRef.current.cancelSearch();
    } else {
      onClose();
    }
    return true;
  });

  const options: Partial<BottomTabNavigationOptions> = {
    headerTitle: title,
    headerRight: undefined,
    headerSearchBarOptions: {
      ref: searchBarRef,
      autoCapitalize: "none",
      cancelButtonText: "取消",
      enterKeyHint: "search",
      placeholder: "搜索UP主",
      onChangeText: ({ nativeEvent: { text } }) => {
        onChangeText(text);
      },
      onClose,
      onSubmitEditing: ({ nativeEvent: { text } }) => {
        onSubmit(text);
      },
    },
  };
  useUpdateNavigationOptions(options);
}
