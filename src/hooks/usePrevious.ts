import { useState } from 'react'

export type ShouldUpdateFunc<T> = (prev: T | undefined, next: T) => boolean

const defaultShouldUpdate = <T>(a?: T, b?: T) => !Object.is(a, b)

function usePrevious<T>(
  state: T,
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
) {
  const [current, setCurrent] = useState<T>(state)
  const [previous, setPrevious] = useState<T>()
  if (shouldUpdate(current, state)) {
    setCurrent(state)
    setPrevious(current)
  }
  return previous
}

export default usePrevious
