import React from "react";
import { View } from "react-native";

import { useStore } from "../../store";
import HotList from "./HotList";
import Ranks from "./Ranks";
import { videoListHeaderLeft, videoListHeaderRight } from "./Header";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

function VideoList() {
  const { currentVideosCate } = useStore();
  useUpdateNavigationOptions({
    headerLeft: videoListHeaderLeft,
    headerTitle: "",
    headerRight: videoListHeaderRight,
  });

  return <View className="flex-1">{currentVideosCate.rid === -1 ? <HotList /> : <Ranks />}</View>;
}

export default VideoList;
