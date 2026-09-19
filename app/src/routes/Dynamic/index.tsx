import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useDynamicItems } from "@/api/dynamic-items";
import type { DynamicItem } from "@/api/dynamic-items.type";
import { useUserInfo } from "@/api/user-info";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { getDynamicDetailTarget, getDynamicVideoTarget } from "@/components/dynamic/dynamic-target";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useMarkFollowingDynamicsRead } from "@/store/actions";
import type { RootStackParamList } from "@/types";

import { headerRight, headerTitle } from "./Header";
import ProfileInfo from "./ProfileInfo";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

function Dynamic({ route, navigation }: Props) {
  const upId = route.params?.user.mid;
  const dynamic = useDynamicItems(upId);
  const { data: userInfo } = useUserInfo(upId);
  const sign = userInfo ? userInfo.sign : (route.params?.user.sign ?? "");

  useUpdateNavigationOptions({ headerTitle, headerRight });
  useMarkFollowingDynamicsRead(upId);

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
      listHeader={<ProfileInfo officialDescription={userInfo?.officialDescription} sign={sign} />}
      onItemPress={openDynamicItem}
    />
  );
}

export default Dynamic;
