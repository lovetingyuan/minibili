import React from 'react'

export default function useMounted(callback: () => void) {
  React.useEffect(() => {
    const clean = callback()
    if (typeof clean === 'function') {
      return clean
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
