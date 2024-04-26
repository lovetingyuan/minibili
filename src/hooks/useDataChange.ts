import React from 'react'

export default function useDataChange(
  callback: () => void,
  deps: React.DependencyList,
) {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback
  React.useEffect(() => {
    return callbackRef.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
