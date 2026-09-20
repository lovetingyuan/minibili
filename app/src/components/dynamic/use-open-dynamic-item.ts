import { useNavigation } from "@react-navigation/native";

import type { DynamicItem } from "@/api/dynamic-items.type";
import type { NavigationProps, UpInfo } from "@/types";

import { getDynamicDetailTarget, getDynamicVideoTarget } from "./dynamic-target";

/**
 * 动态点击去向的唯一规则来源：视频投稿没有独立详情页，直接进播放页，其余进动态详情页。
 * `user` 仅在已知归属 UP 时传入（例如 UP 主页的动态列表），用于详情页头部展示。
 */
export function useOpenDynamicItem() {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  function openDynamicItem(item: DynamicItem, user?: Pick<UpInfo, "mid" | "name">) {
    const videoParams = getDynamicVideoTarget(item);
    if (videoParams) {
      navigation.navigate("Play", videoParams);
      return;
    }
    navigation.navigate("DynamicDetail", getDynamicDetailTarget(item, user));
  }

  return openDynamicItem;
}
