import React from 'react'

export default function useMounted(callback: () => void) {
  React.useEffect(() => {
    callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
