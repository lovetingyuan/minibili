import React from 'react'

export default function useMounted(callback: () => void) {
  React.useEffect(() => {
    callback()
  }, [])
}
