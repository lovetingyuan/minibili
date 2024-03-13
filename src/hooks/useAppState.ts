import { useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import useMounted from './useMounted'

export function useAppStateChange(callback?: (s: AppStateStatus) => void) {
  const currentState = AppState.currentState
  const [appState, setAppState] = useState(currentState)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useMounted(() => {
    function onChange(newState: AppStateStatus) {
      setAppState(newState)
      callbackRef.current?.(newState)
    }

    const subscription = AppState.addEventListener('change', onChange)

    return () => {
      subscription.remove()
    }
  })

  return appState
}
