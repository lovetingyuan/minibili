import PQueue from 'p-queue'
import React from 'react'

import { checkSingleUpUpdate } from '../api/dynamic-items'
import useMounted from '../hooks/useMounted'
import { useStore } from '../store'

function useCheckUpdateUps() {
  const {
    get$followedUps,
    set$upUpdateMap,
    get$upUpdateMap,
    getRequestDynamicFailed,
    setRequestDynamicFailed,
  } = useStore()
  const checkUpdateUpsTimerRef = React.useRef(0)
  useMounted(() => {
    const upUpdateQueue = new PQueue({
      concurrency: 20,
      intervalCap: 8,
      interval: 1000,
    })

    const upUpdateIdMap: Record<string, string> = {}
    const checkTask = () => {
      if (upUpdateQueue.size || upUpdateQueue.pending) {
        return
      }
      if (Date.now() - getRequestDynamicFailed() < 60 * 60 * 1000) {
        return
      }
      const followedUps = get$followedUps()
      for (const up of followedUps) {
        upUpdateQueue.add(async () => {
          const id = await checkSingleUpUpdate(up.mid).catch(() => {
            setRequestDynamicFailed(Date.now())
          })
          if (id) {
            upUpdateIdMap[up.mid] = id
          }
        })
      }
      upUpdateQueue.onIdle().then(() => {
        const updateMap = get$upUpdateMap()
        for (const mid in upUpdateIdMap) {
          const id = upUpdateIdMap[mid]
          if (mid in updateMap) {
            updateMap[mid].currentLatestId = id
          } else {
            updateMap[mid] = {
              latestId: id,
              currentLatestId: id,
            }
          }
        }
        set$upUpdateMap({ ...updateMap })
      })
    }
    setTimeout(() => {
      checkTask() // wait for $followedUps filled.
    }, 1000)
    checkUpdateUpsTimerRef.current = window.setInterval(
      checkTask,
      10 * 60 * 1000,
    )
    return () => {
      upUpdateQueue.clear()
      window.clearInterval(checkUpdateUpsTimerRef.current)
    }
  })
}

export default React.memo(CheckUpUpdate)

function CheckUpUpdate() {
  useCheckUpdateUps()
  return null
}
