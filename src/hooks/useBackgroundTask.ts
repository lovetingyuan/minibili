import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import React from 'react'

const TaskMap = {
  KeepMusicPlay: () => {},
  test: () => null,
  CheckLivingUps: () => null,
}

type TaskMapType = typeof TaskMap

Object.keys(TaskMap).forEach((n) => {
  const name = n as keyof typeof TaskMap
  // 1. Define the task by providing a name and the function that should be executed
  // Note: This needs to be called in the global scope (e.g outside of your React components)
  TaskManager.defineTask(name, async () => {
    // const now = Date.now()
    // console.log(
    //   `Got background fetch call at date: ${new Date(now).toISOString()}`,
    // )
    TaskMap[name]()
    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData
  })
})
type CallbackType<T extends keyof TaskMapType> = T extends keyof TaskMapType
  ? TaskMapType[T]
  : never

export default function useBackgroundTask<T extends keyof TaskMapType>(
  name: T,
  callback: CallbackType<T>,
) {
  TaskMap[name] = callback
  React.useEffect(() => {
    BackgroundFetch.unregisterTaskAsync(name)
      .catch(() => {
        //noop
      })
      .then(() => {
        BackgroundFetch.registerTaskAsync(name, {
          minimumInterval: 5, // 15 minutes
          stopOnTerminate: false, // android only,
          startOnBoot: true, // android only
        })
      })
    return () => {
      BackgroundFetch.unregisterTaskAsync(name)
    }
  }, [name])
}
