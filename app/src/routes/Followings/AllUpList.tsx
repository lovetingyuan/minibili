import { useLiveUps } from '@/api/live-ups'
import { useFollowingDynamicsNavRefresh } from '@/api/useFollowingDynamicsNavUpdates'
import { Text } from '@/components/Text'
import { orderFollowedUps } from '@/features/bilibili-followings/order-followings'
import { useFollowingsState } from '@/features/bilibili-followings/useFollowingsState'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useScreenFocusRefresh } from '@/hooks/useScreenFocusRefresh'
import { useStore } from '@/store'
import { useUnreadUpMids } from '@/store/derives'
import { useActiveFollowedUps } from '@/store/followings'
import type { UpInfo } from '@/types'

import FollowUpsGrid from './FollowUpsGrid'

type Props = {
  specialMids?: ReadonlySet<string>
  onSetGroups?: (up: UpInfo) => void
}

export default function AllUpList({ specialMids, onSetGroups }: Props) {
  const { livingUps } = useStore()
  const $followedUps = useActiveFollowedUps()
  const unreadMids = useUnreadUpMids()
  const { mutate } = useFollowingsState()
  const { mutate: refreshLiveUps } = useLiveUps()
  useScreenFocusRefresh(refreshLiveUps)
  const refreshFollowingDynamicsNav = useFollowingDynamicsNavRefresh()
  const orderedUps = orderFollowedUps($followedUps, livingUps, specialMids, unreadMids)
  // 关注列表会被后台同步、拉黑等操作重新校验，只有用户下拉时才显示刷新图标
  // 下拉时同步刷新关注列表、动态未读与直播状态，三项都结束后再收起刷新图标
  const pullToRefresh = usePullToRefresh(async () => {
    await Promise.allSettled([mutate(), refreshFollowingDynamicsNav(), refreshLiveUps()])
  })

  return (
    <FollowUpsGrid
      ups={orderedUps}
      specialMids={specialMids}
      onSetGroups={onSetGroups}
      refreshing={pullToRefresh.refreshing}
      onRefresh={pullToRefresh.onRefresh}
      emptyContent={
        <Text className="my-10 text-center text-base">暂无关注，请搜索你感兴趣的UP主添加</Text>
      }
      footer={
        $followedUps.length ? (
          <Text className="pb-3 text-center text-xs text-muted">到底了~</Text>
        ) : null
      }
    />
  )
}
