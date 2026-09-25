import { Text, View } from "react-native";

import { useRankList } from "../../api/rank-list";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { useStore } from "../../store";
import VideoList from "./VideoList";

export default Ranks;

function Ranks() {
  const { currentVideosCate } = useStore();
  const { data: list = [], isLoading, mutate } = useRankList(currentVideosCate?.rid);
  // 切分区和定时刷新都会让排行榜重新请求，刷新图标只跟随用户下拉
  const pullToRefresh = usePullToRefresh(() => mutate());
  return (
    <VideoList
      videos={list}
      isRefreshing={pullToRefresh.refreshing}
      onRefresh={pullToRefresh.onRefresh}
      type="Rank"
      footer={
        <View>
          <Text className="my-3 text-center text-gray-500">
            {isLoading ? "加载中..." : "到底了~"}
          </Text>
        </View>
      }
    />
  );
}
