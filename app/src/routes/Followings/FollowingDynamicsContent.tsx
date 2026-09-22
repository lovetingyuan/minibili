import { useFollowingDynamicItems } from "@/api/useFollowingDynamicItems";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { useOpenDynamicItem } from "@/components/dynamic/use-open-dynamic-item";

export default function FollowingDynamicsContent() {
  const dynamics = useFollowingDynamicItems();
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...dynamics}
      emptyTitle="这里还没有关注动态"
      emptyMessage="已关注的 UP 主暂时没有新动态"
      onItemPress={openDynamicItem}
      onTabReselect={() => {
        void dynamics.refresh();
      }}
    />
  );
}
