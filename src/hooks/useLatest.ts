import { useRef } from 'react'

function useLatest<T>(value: T) {
  const ref = useRef(value)
  // eslint-disable-next-line react-compiler/react-compiler
  ref.current = value
  return ref
}

export default useLatest
