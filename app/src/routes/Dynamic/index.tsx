import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useDynamicItems } from "@/api/dynamic-items";
import type { DynamicItem } from "@/api/dynamic-items.type";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { getDynamicDetailTarget, getDynamicVideoTarget } from "@/components/dynamic/dynamic-target";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import type { RootStackParamList } from "@/types";

import { headerRight, headerTitle } from "./Header";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

function Dynamic({ route, navigation }: Props) {
  const upId = route.params?.user.mid;
  const dynamic = useDynamicItems(upId);

  useUpdateNavigationOptions({ headerTitle, headerRight });

  function openDynamicItem(item: DynamicItem) {
    const videoParams = getDynamicVideoTarget(item);
    if (videoParams) {
      navigation.navigate("Play", videoParams);
      return;
    }
    navigation.navigate("DynamicDetail", getDynamicDetailTarget(item, route.params?.user));
  }

  return (
    <DynamicList
      {...dynamic}
      loadingText="正在加载 UP 主动态"
      emptyTitle="这里还没有动态"
      emptyMessage="UP 主暂时没有公开动态"
      onItemPress={openDynamicItem}
    />
  );
}

export default Dynamic;
