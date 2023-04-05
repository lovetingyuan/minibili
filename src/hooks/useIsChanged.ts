import React from 'react'

const init = {}

export default function useIsChanged(value: any) {
  const ref = React.useRef(init)
  React.useEffect(() => {
    ref.current = value
  })
  if (ref.current === init) {
    return false
  }
  return ref.current !== value
}
