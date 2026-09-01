import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";

import { useDynamicItems } from "@/api/dynamic-items";
import type { DynamicItem } from "@/api/dynamic-items.type";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useStore } from "@/store";
import type { RootStackParamList } from "@/types";

import { headerRight, headerTitle } from "./Header";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

function Dynamic({ route, navigation }: Props) {
  const upId = route.params?.user.mid;
  const { reloadUerProfile } = useStore();
  const dynamic = useDynamicItems(upId);

  useUpdateNavigationOptions({ headerTitle, headerRight });

  React.useEffect(() => {
    if (reloadUerProfile) {
      void dynamic.refresh();
    }
  }, [reloadUerProfile]);

  function openDynamicDetail(item: DynamicItem) {
    navigation.navigate("DynamicDetail", {
      dynamicId: item.id,
      title: item.text.slice(0, 24) || "动态详情",
      user: route.params?.user,
    });
  }

  return (
    <DynamicList
      {...dynamic}
      loadingText="正在加载 UP 主动态"
      emptyTitle="这里还没有动态"
      emptyMessage="UP 主暂时没有公开动态"
      onItemPress={openDynamicDetail}
    />
  );
}

export default Dynamic;
