import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { useDynamicItems } from "@/api/dynamic-items";
import { useSpaceContentCounts, useSpaceOpusItems, useSpaceVideoItems } from "@/api/space-items";
import { useUserInfo } from "@/api/user-info";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { useOpenDynamicItem } from "@/components/dynamic/use-open-dynamic-item";
import { theme } from "@/constants/theme";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useMarkFollowingDynamicsRead } from "@/store/actions";
import type { RootStackParamList, UpInfo } from "@/types";

import { headerRight, headerTitle } from "./Header";
import ProfileInfo from "./ProfileInfo";
import SpaceTabs from "./SpaceTabs";
import type { SpaceTab, SpaceTabKey } from "./SpaceTabs.types";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

const SPACE_TABS = [
  { key: "dynamic", label: "动态" },
  { key: "video", label: "视频" },
  { key: "opus", label: "图文" },
] as const satisfies readonly SpaceTab[];

type SpacePageProps = {
  user: UpInfo;
};

function DynamicFeedPage(props: SpacePageProps & { officialDescription?: string; sign: string }) {
  const dynamic = useDynamicItems(props.user.mid);
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...dynamic}
      emptyTitle="这里还没有动态"
      emptyMessage="UP 主暂时没有公开动态"
      listHeader={<ProfileInfo officialDescription={props.officialDescription} sign={props.sign} />}
      onItemPress={(item) => openDynamicItem(item, props.user)}
    />
  );
}

function VideoFeedPage(props: SpacePageProps) {
  const videos = useSpaceVideoItems(props.user);
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...videos}
      errorTitle="视频加载失败"
      emptyTitle="这里还没有视频"
      emptyMessage="UP 主暂时没有公开视频"
      showActions={false}
      onItemPress={(item) => openDynamicItem(item, props.user)}
    />
  );
}

function OpusFeedPage(props: SpacePageProps) {
  const opus = useSpaceOpusItems(props.user);
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...opus}
      errorTitle="图文加载失败"
      emptyTitle="这里还没有图文"
      emptyMessage="UP 主暂时没有公开图文"
      onItemPress={(item) => openDynamicItem(item, props.user)}
    />
  );
}

function Dynamic({ route }: Props) {
  const user = route.params?.user;
  const upId = user?.mid;
  const { data: userInfo } = useUserInfo(upId);
  const { videoCount, opusCount } = useSpaceContentCounts(upId);
  const sign = userInfo ? userInfo.sign : (user?.sign ?? "");
  const [selectedKey, setSelectedKey] = React.useState<SpaceTabKey>("dynamic");
  const [visitedKeys, setVisitedKeys] = React.useState<SpaceTabKey[]>(["dynamic"]);
  const pagerRef = React.useRef<PagerView | null>(null);
  const pagerTargetRef = React.useRef<number | null>(null);

  useUpdateNavigationOptions({ headerTitle, headerRight });
  useMarkFollowingDynamicsRead(upId);

  if (!user) {
    return <View className={`flex-1 ${theme.background.page}`} />;
  }

  function markVisited(key: SpaceTabKey) {
    setVisitedKeys((previous) => (previous.includes(key) ? previous : [...previous, key]));
  }

  function selectTab(key: SpaceTabKey) {
    const index = SPACE_TABS.findIndex((tab) => tab.key === key);
    if (index < 0 || key === selectedKey) {
      return;
    }
    markVisited(key);
    setSelectedKey(key);
    pagerTargetRef.current = index;
    pagerRef.current?.setPage(index);
  }

  function handlePageSelected(position: number) {
    if (pagerTargetRef.current !== null) {
      if (position !== pagerTargetRef.current) {
        return;
      }
      pagerTargetRef.current = null;
    }
    const tab = SPACE_TABS[position];
    if (!tab) {
      return;
    }
    markVisited(tab.key);
    setSelectedKey(tab.key);
  }

  const visited = new Set(visitedKeys);
  const tabs = SPACE_TABS.map((tab) => ({
    ...tab,
    count: tab.key === "video" ? videoCount : tab.key === "opus" ? opusCount : undefined,
  }));

  return (
    <View className={`flex-1 ${theme.background.page}`}>
      <SpaceTabs tabs={tabs} selectedKey={selectedKey} onSelect={selectTab} />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={({ nativeEvent }) => handlePageSelected(nativeEvent.position)}
        onPageScrollStateChanged={({ nativeEvent }) => {
          if (nativeEvent.pageScrollState === "dragging") {
            pagerTargetRef.current = null;
          }
        }}
      >
        <View key="dynamic" collapsable={false} className="flex-1">
          <DynamicFeedPage
            user={user}
            officialDescription={userInfo?.officialDescription}
            sign={sign}
          />
        </View>
        <View key="video" collapsable={false} className="flex-1">
          {visited.has("video") ? <VideoFeedPage user={user} /> : null}
        </View>
        <View key="opus" collapsable={false} className="flex-1">
          {visited.has("opus") ? <OpusFeedPage user={user} /> : null}
        </View>
      </PagerView>
    </View>
  );
}

export default Dynamic;
