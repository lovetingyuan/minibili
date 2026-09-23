import { useBackHandler } from "@react-native-community/hooks";
import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

import UpList from "./UpList";

const defaultSearchBarCommands: SearchBarCommands = {
  blur: () => {},
  setText: () => {},
  focus: () => {},
  clearText: () => {},
  toggleCancelButton: () => {},
  cancelSearch: () => {},
};

function SearchUps() {
  const searchBarRef = React.useRef<SearchBarCommands>(defaultSearchBarCommands);
  const blackColor = useResolvedColor(theme.text.primary);
  const [searchKeyWord, setSearchKeyWord] = React.useState("");
  const focused = useIsFocused();
  useBackHandler(() => {
    if (searchKeyWord && focused) {
      searchBarRef.current?.blur();
      searchBarRef.current?.setText("");
      setSearchKeyWord("");
      return true;
    }
    return false;
  });
  useUpdateNavigationOptions({
    headerSearchBarOptions: {
      ref: searchBarRef,
      placeholder: "搜索UP主",
      headerIconColor: blackColor,
      hintTextColor: blackColor,
      textColor: blackColor,
      tintColor: blackColor,
      disableBackButtonOverride: false,
      shouldShowHintSearchIcon: false,
      onClose: () => {
        setSearchKeyWord("");
      },
      onSearchButtonPress: ({ nativeEvent: { text } }) => {
        const keyword = text.trim();
        if (!keyword) {
          return;
        }
        setSearchKeyWord(keyword);
      },
    },
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchBarRef.current?.focus();
      searchBarRef.current?.setText("");
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <UpList keyword={searchKeyWord} />
    </KeyboardAvoidingView>
  );
}

export default SearchUps;
