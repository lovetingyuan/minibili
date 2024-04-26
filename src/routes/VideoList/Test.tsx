import { useAppState } from '@react-native-community/hooks'
import { Text } from '@rneui/themed'
import React from 'react'

import useBackgroundTask from '@/hooks/useBackgroundTask'
import useMemoizedFn from '@/hooks/useMemoizedFn'
import useMounted from '@/hooks/useMounted'
const getTime = new Date().toLocaleTimeString()
export default function Test() {
  const [count, setCount] = React.useState(0)
  const [time, setTime] = React.useState(getTime)
  const state = useAppState()
  console.log(99, state)
  // useBackgroundTask(
  //   'test',
  //   useMemoizedFn(() => {
  //     console.log(99)
  //     const time = setInterval(() => {
  //       setTime(getTime())
  //     }, 1000)
  //   }),
  // )
  // useMounted(() => {
  //   console.log(99)
  //   const timer = setInterval(() => {
  //     setCount(c => c + 1)
  //   }, 1000)
  //   return () => clearInterval(timer)
  // })
  return (
    <Text className="text-lg text-center">
      {time}: {count}
    </Text>
  )
}
