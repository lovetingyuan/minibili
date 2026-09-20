import React from 'react'
import { Alert, View } from 'react-native'
import PagerView from 'react-native-pager-view'

import {
  getFollowGroupTags,
  getSelectableRelationTags,
  RelationTagLoginRequiredError,
} from '@/api/relation-tags'
import {
  useBilibiliRelationTags,
  useBilibiliSpecialFollowUps,
  useRelationTagActions,
} from '@/api/useBilibiliRelationTags'
import { Button, Dialog, Text } from '@/components/styled/rneui'
import { colors } from '@/constants/colors.tw'
import { BilibiliSessionChangedError } from '@/features/bilibili-session/controller'
import { bilibiliSession } from '@/features/bilibili-session/session'
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from '@/features/bilibili-session/useBilibiliSession'
import { useStore } from '@/store'
import { useActiveFollowedUps } from '@/store/followings'
import type { UpInfo } from '@/types'
import { showToast } from '@/utils'

import AllUpList from './AllUpList'
import FollowGroupTabs from './FollowGroupTabs'
import type { FollowGroupEditorState, FollowGroupTab } from './FollowGroups.types'
import GroupNameDialog from './GroupNameDialog'
import GroupUpList from './GroupUpList'
import SetUpGroupDialog from './SetUpGroupDialog'
import useFollowListHeader from './FollowListHeader'

const ALL_TAB_KEY = 'all'
const tagTabKey = (tagid: number) => `tag-${tagid}`

function toError(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause : new Error(fallback)
}

function FollowList() {
  const [selectedKey, setSelectedKey] = React.useState(ALL_TAB_KEY)
  const [visitedKeys, setVisitedKeys] = React.useState<string[]>([ALL_TAB_KEY])
  const [editor, setEditor] = React.useState<FollowGroupEditorState | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [editorError, setEditorError] = React.useState<Error | null>(null)
  const [groupTarget, setGroupTarget] = React.useState<UpInfo | null>(null)
  const [deletingGroup, setDeletingGroup] = React.useState<{ tagid: number; name: string } | null>(
    null,
  )
  /** PagerView 当前显示的页码，用户滑动与程序化切页都会更新它 */
  const [pagerIndex, setPagerIndex] = React.useState(0)
  const pagerRef = React.useRef<PagerView | null>(null)
  // 程序化切页的目标页码：ViewPager2 平滑滚动时会依次上报中间页，这里用它忽略这些中间事件
  const pagerTargetRef = React.useRef<number | null>(null)

  const $followedUps = useActiveFollowedUps()
  const tags = useBilibiliRelationTags()
  const specialFollowUps = useBilibiliSpecialFollowUps()
  const { createTag, renameTag, deleteTag, setUpGroups } = useRelationTagActions()
  const { setOverlayButtons } = useStore()
  const { account } = useBilibiliSessionState()
  const sessionActions = useBilibiliSessionActions()

  const tabs: FollowGroupTab[] = [
    { key: ALL_TAB_KEY, tagid: null, name: '全部', count: $followedUps.length, custom: false },
    ...getFollowGroupTags(tags.data ?? []).map(tag => ({
      key: tagTabKey(tag.tagid),
      tagid: tag.tagid,
      name: tag.name,
      count: tag.count,
      custom: tag.tagid > 0,
    })),
  ]
  const foundIndex = tabs.findIndex(tab => tab.key === selectedKey)
  // 分组列表刷新期间，刚选中/刚新建的分组可能还不在列表里：此时先停在当前页，
  // 等它出现再切过去，避免先跳到别的 tab 再跳回来。
  const activeIndex =
    foundIndex >= 0 ? foundIndex : Math.max(0, Math.min(pagerIndex, tabs.length - 1))
  const activeTab = tabs[activeIndex] ?? tabs[0]
  const selectableTags = getSelectableRelationTags(tags.data ?? [])

  React.useEffect(() => {
    if (activeIndex === pagerIndex) {
      return
    }
    pagerTargetRef.current = activeIndex
    setPagerIndex(activeIndex)
    pagerRef.current?.setPage(activeIndex)
  }, [activeIndex, pagerIndex])

  useFollowListHeader({
    title: `关注的UP`,
  })

  function assertAccount() {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      showToast('登录状态已改变，请重新登录后操作')
      return false
    }
    return true
  }

  function requestRelogin(error: Error) {
    Alert.alert('请重新登录 B站', error.message, [
      { text: '取消', style: 'cancel' },
      {
        text: '重新登录',
        onPress: () => {
          if (!account || !bilibiliSession.isCurrentAccount(account)) {
            showToast('登录状态已改变，请重新操作')
            return
          }
          void sessionActions.logout().catch(() => showToast('退出登录失败，请在设置页重试'))
        },
      },
    ])
  }

  function markVisited(key: string) {
    setVisitedKeys(previous => (previous.includes(key) ? previous : [...previous, key]))
  }

  function selectTab(tab: FollowGroupTab) {
    markVisited(tab.key)
    setSelectedKey(tab.key)
  }

  function handlePageSelected(position: number) {
    if (pagerTargetRef.current !== null) {
      if (position !== pagerTargetRef.current) {
        // 程序化切页途中的中间页，不改变选中态
        return
      }
      pagerTargetRef.current = null
    }
    const tab = tabs[position]
    if (!tab) {
      return
    }
    setPagerIndex(position)
    markVisited(tab.key)
    setSelectedKey(tab.key)
  }

  function openCreateDialog() {
    setEditorError(null)
    setEditor({ mode: 'create' })
  }

  function openRenameDialog(tab: FollowGroupTab) {
    if (tab.tagid === null || tab.tagid <= 0) {
      return
    }
    setEditorError(null)
    setEditor({ mode: 'rename', tagid: tab.tagid, name: tab.name })
  }

  function closeEditor() {
    if (saving) {
      return
    }
    setEditor(null)
    setEditorError(null)
  }

  function handleLongPressTab(tab: FollowGroupTab) {
    if (!tab.custom) {
      // 特别关注与默认分组是 B站 内置分组，改名与删除都会被服务端拒绝
      showToast('内置分组不支持改名或删除，点「+」新建分组后即可管理')
      return
    }
    setOverlayButtons([
      {
        text: '修改名称',
        onPress: () => {
          openRenameDialog(tab)
        },
      },
      {
        text: '删除分组',
        onPress: () => {
          confirmDeleteTab(tab)
        },
      },
    ])
  }

  function confirmDeleteTab(tab: FollowGroupTab) {
    const tagid = tab.tagid
    if (tagid === null || tagid <= 0) {
      return
    }
    Alert.alert('删除分组', `删除「${tab.name}」后，该分组下的 UP 会回到默认分组。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void removeTab(tagid, tab.name)
        },
      },
    ])
  }

  async function removeTab(tagid: number, name: string) {
    if (!assertAccount()) {
      return
    }
    setDeletingGroup({ tagid, name })
    try {
      await deleteTag(tagid)
      if (selectedKey === tagTabKey(tagid)) {
        setSelectedKey(ALL_TAB_KEY)
      }
      showToast(`已删除分组「${name}」`)
    } catch (cause) {
      const error = toError(cause, '删除分组失败，请稍后重试')
      if (error instanceof RelationTagLoginRequiredError) {
        requestRelogin(error)
        return
      }
      showToast(
        error instanceof BilibiliSessionChangedError ? '登录状态已改变，请重新操作' : error.message,
      )
    } finally {
      setDeletingGroup(null)
    }
  }

  async function submitEditor(name: string) {
    if (!editor || saving || !assertAccount()) {
      return
    }
    setSaving(true)
    setEditorError(null)
    try {
      if (editor.mode === 'create') {
        const created = await createTag(name)
        markVisited(tagTabKey(created.tagid))
        setSelectedKey(tagTabKey(created.tagid))
        showToast(`已新建分组「${name}」`)
      } else {
        await renameTag(editor.tagid, name)
        showToast(`已重命名为「${name}」`)
      }
      setEditor(null)
    } catch (cause) {
      const error = toError(cause, '分组操作失败，请稍后重试')
      if (error instanceof RelationTagLoginRequiredError) {
        setEditor(null)
        requestRelogin(error)
        return
      }
      if (error instanceof BilibiliSessionChangedError) {
        setEditor(null)
        showToast('登录状态已改变，请重新操作')
        return
      }
      setEditorError(error)
    } finally {
      setSaving(false)
    }
  }

  async function submitGroups(tagids: number[]) {
    const target = groupTarget
    if (!target) {
      return
    }
    await setUpGroups(target.mid, tagids)
    setGroupTarget(null)
    showToast('已设置分组')
  }

  function refreshTags() {
    return tags.mutate().catch(() => undefined)
  }

  const visitedKeySet = new Set(visitedKeys)

  return (
    <View className="flex-1">
      {tags.error ? (
        <View className="flex-row items-center justify-center gap-2 px-3 py-2">
          <Text className="shrink text-xs">分组加载失败，正在显示上次数据</Text>
          <Button
            title="重试"
            type="clear"
            size="sm"
            loading={tags.isValidating}
            onPress={() => {
              void refreshTags()
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
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={activeIndex}
        onPageSelected={({ nativeEvent }) => {
          handlePageSelected(nativeEvent.position)
        }}
        onPageScrollStateChanged={({ nativeEvent }) => {
          // 用户重新接管手势时清掉程序化切页的目标，避免后续页码被误忽略
          if (nativeEvent.pageScrollState === 'dragging') {
            pagerTargetRef.current = null
          }
        }}
      >
        {tabs.map(tab => (
          <View key={tab.key} collapsable={false} className="flex-1">
            {visitedKeySet.has(tab.key) ? (
              tab.tagid === null ? (
                <AllUpList specialMids={specialFollowUps.data} onSetGroups={setGroupTarget} />
              ) : (
                <GroupUpList
                  tagid={tab.tagid}
                  specialMids={specialFollowUps.data}
                  onSetGroups={setGroupTarget}
                  onRefreshTags={refreshTags}
                />
              )
            ) : null}
          </View>
        ))}
      </PagerView>
      {editor ? (
        <GroupNameDialog
          mode={editor.mode}
          initialName={editor.mode === 'rename' ? editor.name : ''}
          saving={saving}
          error={editorError}
          onClose={closeEditor}
          onSubmit={name => {
            void submitEditor(name)
          }}
        />
      ) : null}
      {groupTarget ? (
        <SetUpGroupDialog
          key={`${groupTarget.mid}`}
          up={groupTarget}
          groups={selectableTags}
          onClose={() => {
            setGroupTarget(null)
          }}
          onSubmit={submitGroups}
          onLoginRequired={error => {
            setGroupTarget(null)
            requestRelogin(error)
          }}
        />
      ) : null}
      {deletingGroup ? (
        <Dialog
          isVisible
          overlayClassName={`w-[70%] max-w-xs rounded-xl ${colors.white.bg}`}
          onRequestClose={() => {}}
        >
          <Dialog.Loading />
          <Text className={`pb-4 text-center ${colors.gray7.text}`}>
            正在删除分组「{deletingGroup.name}」…
          </Text>
        </Dialog>
      ) : null}
    </View>
  )
}

export default FollowList
