import { useEffect, useState, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useAppState(callback?: (s: AppStateStatus) => void) {
  const currentState = AppState.currentState
  const [appState, setAppState] = useState(currentState)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    function onChange(newState: AppStateStatus) {
      setAppState(newState)
      callbackRef.current?.(newState)
    }

    const subscription = AppState.addEventListener('change', onChange)

    return () => {
      subscription.remove()
    }
  }, [])

  return appState
}