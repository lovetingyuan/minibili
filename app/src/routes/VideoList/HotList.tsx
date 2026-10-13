import { Text } from "react-native";

import { useHotVideos } from "../../api/hot-videos";
import useErrToast from "../../hooks/useErrToast";
import VideoList from "./VideoList";

export default Hot;

function Hot() {
  const { list, update, isRefreshing, loading, isReachingEnd, error, refresh } =
    useHotVideos();
  useErrToast("加载视频列表失败", error);

  const getFooter = (_list: any[]) => {
    return (
      <Text className="my-3 text-center text-muted">
        {loading ? `加载中(${_list.length})...` : isReachingEnd ? `到底了(${_list.length})~` : ""}
      </Text>
    );
  };

  return (
    <VideoList
      type="Hot"
      videos={list || []}
      isRefreshing={isRefreshing}
      onReachEnd={update}
      onRefresh={refresh}
      onTabReselect={refresh}
      footer={getFooter}
    />
  );
}
