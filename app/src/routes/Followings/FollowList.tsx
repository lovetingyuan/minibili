import type { HeaderSearchBarRef } from "@react-navigation/elements";
import React from "react";
import { Alert, View } from "react-native";
import PagerView from "react-native-pager-view";

import {
  getFollowGroupTags,
  getSelectableRelationTags,
  RelationTagLoginRequiredError,
} from "@/api/relation-tags";
import { useBilibiliRelationTags, useRelationTagActions } from "@/api/useBilibiliRelationTags";
import { Button, Text } from "@/components/styled/rneui";
import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { useStore } from "@/store";
import { useActiveFollowedUps } from "@/store/followings";
import type { UpInfo } from "@/types";
import { showToast } from "@/utils";

import AllUpList from "./AllUpList";
import FollowGroupTabs from "./FollowGroupTabs";
import type { FollowGroupEditorState, FollowGroupTab } from "./FollowGroups.types";
import GroupNameDialog from "./GroupNameDialog";
import GroupUpList from "./GroupUpList";
import SetUpGroupDialog from "./SetUpGroupDialog";
import UpList from "./UpList";
import useFollowListHeader from "./FollowListHeader";

const ALL_TAB_KEY = "all";
const tagTabKey = (tagid: number) => `tag-${tagid}`;

function toError(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause : new Error(fallback);
}

function FollowList() {
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState(ALL_TAB_KEY);
  const [visitedKeys, setVisitedKeys] = React.useState<string[]>([ALL_TAB_KEY]);
  const [editor, setEditor] = React.useState<FollowGroupEditorState | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [editorError, setEditorError] = React.useState<Error | null>(null);
  const [groupTarget, setGroupTarget] = React.useState<UpInfo | null>(null);
  const pagerRef = React.useRef<PagerView | null>(null);
  const searchBarRef = React.useRef<HeaderSearchBarRef | null>(null);

  const $followedUps = useActiveFollowedUps();
  const tags = useBilibiliRelationTags();
  const { createTag, renameTag, deleteTag, setUpGroups } = useRelationTagActions();
  const { setOverlayButtons } = useStore();
  const { account } = useBilibiliSessionState();
  const sessionActions = useBilibiliSessionActions();

  const tabs: FollowGroupTab[] = [
    { key: ALL_TAB_KEY, tagid: null, name: "全部", count: $followedUps.length, custom: false },
    ...getFollowGroupTags(tags.data ?? []).map((tag) => ({
      key: tagTabKey(tag.tagid),
      tagid: tag.tagid,
      name: tag.name,
      count: tag.count,
      custom: tag.tagid > 0,
    })),
  ];
  const foundIndex = tabs.findIndex((tab) => tab.key === selectedKey);
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const activeTab = tabs[activeIndex];
  const selectableTags = getSelectableRelationTags(tags.data ?? []);

  React.useEffect(() => {
    pagerRef.current?.setPage(activeIndex);
  }, [activeIndex]);

  function changeSearchText(text: string) {
    if (!text.trim()) {
      setSearchKeyword("");
    }
  }

  function submitSearch(text: string) {
    const keyword = text.trim();
    if (!keyword) {
      return;
    }
    setSearchKeyword(keyword);
  }

  function cancelSearch() {
    setSearchKeyword("");
  }

  useFollowListHeader({
    title: `关注的UP (${$followedUps.length})`,
    onChangeText: changeSearchText,
    onClose: cancelSearch,
    onSubmit: submitSearch,
    searchActive: Boolean(searchKeyword),
    searchBarRef,
  });

  function assertAccount() {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      showToast("登录状态已改变，请重新登录后操作");
      return false;
    }
    return true;
  }

  function requestRelogin(error: Error) {
    Alert.alert("请重新登录 B站", error.message, [
      { text: "取消", style: "cancel" },
      {
        text: "重新登录",
        onPress: () => {
          if (!account || !bilibiliSession.isCurrentAccount(account)) {
            showToast("登录状态已改变，请重新操作");
            return;
          }
          void sessionActions.logout().catch(() => showToast("退出登录失败，请在设置页重试"));
        },
      },
    ]);
  }

  function markVisited(key: string) {
    setVisitedKeys((previous) => (previous.includes(key) ? previous : [...previous, key]));
  }

  function selectTab(tab: FollowGroupTab) {
    markVisited(tab.key);
    setSelectedKey(tab.key);
  }

  function handlePageSelected(position: number) {
    const tab = tabs[position];
    if (!tab) {
      return;
    }
    markVisited(tab.key);
    setSelectedKey(tab.key);
  }

  function openCreateDialog() {
    setEditorError(null);
    setEditor({ mode: "create" });
  }

  function openRenameDialog(tab: FollowGroupTab) {
    if (tab.tagid === null || tab.tagid <= 0) {
      return;
    }
    setEditorError(null);
    setEditor({ mode: "rename", tagid: tab.tagid, name: tab.name });
  }

  function closeEditor() {
    if (saving) {
      return;
    }
    setEditor(null);
    setEditorError(null);
  }

  function handleLongPressTab(tab: FollowGroupTab) {
    if (!tab.custom) {
      return;
    }
    setOverlayButtons([
      {
        text: "修改名称",
        onPress: () => {
          openRenameDialog(tab);
        },
      },
      {
        text: "删除分组",
        onPress: () => {
          confirmDeleteTab(tab);
        },
      },
    ]);
  }

  function confirmDeleteTab(tab: FollowGroupTab) {
    const tagid = tab.tagid;
    if (tagid === null || tagid <= 0) {
      return;
    }
    Alert.alert("删除分组", `删除「${tab.name}」后，该分组下的 UP 会回到默认分组。`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          void removeTab(tagid, tab.name);
        },
      },
    ]);
  }

  async function removeTab(tagid: number, name: string) {
    if (!assertAccount()) {
      return;
    }
    try {
      await deleteTag(tagid);
      if (selectedKey === tagTabKey(tagid)) {
        setSelectedKey(ALL_TAB_KEY);
      }
      showToast(`已删除分组「${name}」`);
    } catch (cause) {
      const error = toError(cause, "删除分组失败，请稍后重试");
      if (error instanceof RelationTagLoginRequiredError) {
        requestRelogin(error);
        return;
      }
      showToast(
        error instanceof BilibiliSessionChangedError ? "登录状态已改变，请重新操作" : error.message,
      );
    }
  }

  async function submitEditor(name: string) {
    if (!editor || saving || !assertAccount()) {
      return;
    }
    setSaving(true);
    setEditorError(null);
    try {
      if (editor.mode === "create") {
        const created = await createTag(name);
        markVisited(tagTabKey(created.tagid));
        setSelectedKey(tagTabKey(created.tagid));
        showToast(`已新建分组「${name}」`);
      } else {
        await renameTag(editor.tagid, name);
        showToast(`已重命名为「${name}」`);
      }
      setEditor(null);
    } catch (cause) {
      const error = toError(cause, "分组操作失败，请稍后重试");
      if (error instanceof RelationTagLoginRequiredError) {
        setEditor(null);
        requestRelogin(error);
        return;
      }
      if (error instanceof BilibiliSessionChangedError) {
        setEditor(null);
        showToast("登录状态已改变，请重新操作");
        return;
      }
      setEditorError(error);
    } finally {
      setSaving(false);
    }
  }

  async function submitGroups(tagids: number[]) {
    const target = groupTarget;
    if (!target) {
      return;
    }
    await setUpGroups(target.mid, tagids);
    setGroupTarget(null);
    showToast("已设置分组");
  }

  function refreshTags() {
    return tags.mutate().catch(() => undefined);
  }

  return (
    <View className="flex-1">
      {searchKeyword ? (
        <UpList keyword={searchKeyword} />
      ) : (
        <>
          {tags.error ? (
            <View className="flex-row items-center justify-center gap-2 px-3 py-2">
              <Text className="shrink text-xs">分组加载失败，正在显示上次数据</Text>
              <Button
                title="重试"
                type="clear"
                size="sm"
                loading={tags.isValidating}
                onPress={() => {
                  void refreshTags();
                }}
              />
            </View>
          ) : null}
          <FollowGroupTabs
            tabs={tabs}
            selectedKey={activeTab.key}
            disabled={false}
            onSelect={selectTab}
            onLongPress={handleLongPressTab}
            onCreate={openCreateDialog}
          />
          <PagerView
            key={tabs.length}
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={activeIndex}
            onPageSelected={({ nativeEvent }) => {
              handlePageSelected(nativeEvent.position);
            }}
          >
            {tabs.map((tab) => (
              <View key={tab.key} collapsable={false} className="flex-1">
                {visitedKeys.includes(tab.key) ? (
                  tab.tagid === null ? (
                    <AllUpList onSetGroups={setGroupTarget} />
                  ) : (
                    <GroupUpList
                      tagid={tab.tagid}
                      onSetGroups={setGroupTarget}
                      onRefreshTags={refreshTags}
                    />
                  )
                ) : null}
              </View>
            ))}
          </PagerView>
        </>
      )}
      {editor ? (
        <GroupNameDialog
          mode={editor.mode}
          initialName={editor.mode === "rename" ? editor.name : ""}
          saving={saving}
          error={editorError}
          onClose={closeEditor}
          onSubmit={(name) => {
            void submitEditor(name);
          }}
        />
      ) : null}
      {groupTarget ? (
        <SetUpGroupDialog
          key={`${groupTarget.mid}`}
          up={groupTarget}
          groups={selectableTags}
          onClose={() => {
            setGroupTarget(null);
          }}
          onSubmit={submitGroups}
          onLoginRequired={(error) => {
            setGroupTarget(null);
            requestRelogin(error);
          }}
        />
      ) : null}
    </View>
  );
}

export default FollowList;
