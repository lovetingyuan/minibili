import React from 'react'
import { Text } from 'react-native'

import { useHotVideos } from '../../api/hot-videos'
import useErrToast from '../../hooks/useErrToast'
import VideoList from './VideoList'

let refreshTime = Date.now()

export default React.memo(Hot)

function Hot() {
  const [reload, setReload] = React.useState(0)
  const {
    list,
    page,
    setSize,
    isRefreshing,
    loading,
    mutate,
    isReachingEnd,
    error,
  } = useHotVideos(reload)
  React.useEffect(() => {
    if (Date.now() - refreshTime > 5 * 60 * 1000) {
      mutate()
      refreshTime = Date.now()
    }
  }, [mutate])
  useErrToast('加载视频列表失败', error)

  const getFooter = (_list: any[]) => {
    return (
      <Text className="text-center my-3 text-gray-500">
        {loading
          ? `加载中(${_list.length})...`
          : isReachingEnd
            ? `到底了(${_list.length})~`
            : ''}
      </Text>
    )
  }

  return (
    <VideoList
      type="Hot"
      videos={list || []}
      isRefreshing={isRefreshing}
      onReachEnd={() => {
        setSize(page + 1)
      }}
      onRefresh={fab => {
        // mutate()
        if (!fab) {
          setReload(reload + 1)
        } else {
          mutate()
        }
      }}
      footer={getFooter}
    />
  )
}
