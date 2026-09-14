import { useNavigation } from "@react-navigation/native";

import type { DynamicItem } from "@/api/dynamic-items.type";
import { useFollowingDynamicItems } from "@/api/useFollowingDynamicItems";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { getDynamicDetailTarget, getDynamicVideoTarget } from "@/components/dynamic/dynamic-target";
import type { NavigationProps } from "@/types";

export default function FollowingDynamicsContent() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const dynamics = useFollowingDynamicItems();

  function openDynamicItem(item: DynamicItem) {
    const videoParams = getDynamicVideoTarget(item);
    if (videoParams) {
      navigation.navigate("Play", videoParams);
      return;
    }
    navigation.navigate("DynamicDetail", getDynamicDetailTarget(item));
  }

  return (
    <DynamicList
      {...dynamics}
      loadingText="正在加载关注动态"
      emptyTitle="这里还没有关注动态"
      emptyMessage="已关注的 UP 主暂时没有新动态"
      onItemPress={openDynamicItem}
      onTabReselect={() => {
        void dynamics.refresh();
      }}
    />
  );
}
