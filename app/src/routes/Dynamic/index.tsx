import { useBackHandler } from "@react-native-community/hooks";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Keyboard, View } from "react-native";
import PagerView from "react-native-pager-view";

import { useDynamicItems } from "@/api/dynamic-items";
import { useSpaceDynamicSearchItems, useSpaceVideoSearchItems } from "@/api/space-search";
import type { SpaceSearchTabKey } from "@/api/space-search.types";
import { useSpaceContentCounts, useSpaceOpusItems, useSpaceVideoItems } from "@/api/space-items";
import { useUserInfo } from "@/api/user-info";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { useOpenDynamicItem } from "@/components/dynamic/use-open-dynamic-item";
import { Text } from "@/components/styled/rneui";
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

function VideoSearchPage(props: SpacePageProps & { keyword: string }) {
  const videos = useSpaceVideoSearchItems(props.user, props.keyword);
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...videos}
      errorTitle="视频搜索失败"
      emptyTitle="没有找到相关视频"
      emptyMessage="换个关键词试试"
      showActions={false}
      onItemPress={(item) => openDynamicItem(item, props.user)}
    />
  );
}

function DynamicSearchPage(props: SpacePageProps & { keyword: string }) {
  const dynamic = useSpaceDynamicSearchItems(props.user, props.keyword);
  const openDynamicItem = useOpenDynamicItem();

  return (
    <DynamicList
      {...dynamic}
      errorTitle="动态搜索失败"
      emptyTitle="没有找到相关动态"
      emptyMessage="换个关键词试试"
      onItemPress={(item) => openDynamicItem(item, props.user)}
    />
  );
}

function SearchPrompt() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text selectable className={`text-center text-sm ${theme.text.muted}`}>
        输入关键词搜索该 UP 的内容
      </Text>
    </View>
  );
}

function SearchResults(props: SpacePageProps & { keyword: string; type: SpaceSearchTabKey }) {
  if (!props.keyword) {
    return <SearchPrompt />;
  }
  return props.type === "video" ? (
    <VideoSearchPage user={props.user} keyword={props.keyword} />
  ) : (
    <DynamicSearchPage user={props.user} keyword={props.keyword} />
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
  const [searching, setSearching] = React.useState(false);
  const [searchDraft, setSearchDraft] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [searchType, setSearchType] = React.useState<SpaceSearchTabKey>("video");
  const pagerRef = React.useRef<PagerView | null>(null);
  const pagerTargetRef = React.useRef<number | null>(null);
  const focused = useIsFocused();

  useUpdateNavigationOptions({ headerTitle, headerRight });
  useMarkFollowingDynamicsRead(upId);

  function exitSearch() {
    Keyboard.dismiss();
    setSearching(false);
    setSearchDraft("");
    setSearchKeyword("");
    setSearchType("video");
  }

  useBackHandler(() => {
    if (!searching || !focused) {
      return false;
    }
    exitSearch();
    return true;
  });

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
  const selectedPage = Math.max(
    0,
    SPACE_TABS.findIndex((tab) => tab.key === selectedKey),
  );

  function openSearch() {
    setSearchDraft("");
    setSearchKeyword("");
    setSearchType("video");
    setSearching(true);
  }

  function submitSearch() {
    const keyword = searchDraft.trim();
    if (!keyword) {
      return;
    }
    Keyboard.dismiss();
    setSearchDraft(keyword);
    setSearchKeyword(keyword);
  }

  return (
    <View className={`flex-1 ${theme.background.page}`}>
      {searching ? (
        <SpaceTabs
          mode="search"
          selectedKey={searchType}
          query={searchDraft}
          onChangeQuery={setSearchDraft}
          onSelect={setSearchType}
          onSubmit={submitSearch}
          onClose={exitSearch}
        />
      ) : (
        <SpaceTabs
          mode="browse"
          tabs={tabs}
          selectedKey={selectedKey}
          onSelect={selectTab}
          onOpenSearch={openSearch}
        />
      )}
      {searching ? (
        <SearchResults user={user} keyword={searchKeyword} type={searchType} />
      ) : (
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={selectedPage}
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
      )}
    </View>
  );
}

export default Dynamic;
