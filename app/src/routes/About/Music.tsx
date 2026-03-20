import { useNavigation } from "@react-navigation/native";
import React from "react";

import type { NavigationProps } from "@/types";

import TextAction from "./TextAction";

function MyMusic() {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  return (
    <TextAction
      text="🎵 我的歌单"
      buttons={[
        {
          text: "查看歌单",
          onPress: () => {
            navigation.navigate("Music");
          },
        },
      ]}
    />
  );
}

export default MyMusic;
