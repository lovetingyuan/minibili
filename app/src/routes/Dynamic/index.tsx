import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useDynamicItems } from "@/api/dynamic-items";
import { useUserInfo } from "@/api/user-info";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { useOpenDynamicItem } from "@/components/dynamic/use-open-dynamic-item";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useMarkFollowingDynamicsRead } from "@/store/actions";
import type { RootStackParamList } from "@/types";

import { headerRight, headerTitle } from "./Header";
import ProfileInfo from "./ProfileInfo";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

function Dynamic({ route }: Props) {
  const upId = route.params?.user.mid;
  const dynamic = useDynamicItems(upId);
  const { data: userInfo } = useUserInfo(upId);
  const sign = userInfo ? userInfo.sign : (route.params?.user.sign ?? "");
  const openDynamicItem = useOpenDynamicItem();

  useUpdateNavigationOptions({ headerTitle, headerRight });
  useMarkFollowingDynamicsRead(upId);

  return (
    <DynamicList
      {...dynamic}
      loadingText="正在加载 UP 主动态"
      emptyTitle="这里还没有动态"
      emptyMessage="UP 主暂时没有公开动态"
      listHeader={<ProfileInfo officialDescription={userInfo?.officialDescription} sign={sign} />}
      onItemPress={(item) => openDynamicItem(item, route.params?.user)}
    />
  );
}

export default Dynamic;
