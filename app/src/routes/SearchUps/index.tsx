import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import { colors } from "@/constants/colors.tw";
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
  const blackColor = useResolvedColor(colors.black.text);
  const [searchKeyWord, setSearchKeyWord] = React.useState("");

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
    setTimeout(() => {
      searchBarRef.current?.focus();
    }, 80);
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
