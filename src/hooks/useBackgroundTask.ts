import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import React from 'react'

const TaskMap = {
  KeepMusicPlay: () => null,
  test: () => null,
  CheckLivingUps: () => null,
}

Object.keys(TaskMap).forEach(name => {
  // 1. Define the task by providing a name and the function that should be executed
  // Note: This needs to be called in the global scope (e.g outside of your React components)
  TaskManager.defineTask(name, async () => {
    // const now = Date.now()
    // console.log(
    //   `Got background fetch call at date: ${new Date(now).toISOString()}`,
    // )
    // @ts-ignore
    TaskMap[name]()
    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData
  })
})

export default function useBackgroundTask(
  name: keyof typeof TaskMap,
  callback: () => void,
) {
  // @ts-ignore
  TaskMap[name] = callback
  // TaskMap[name] = callback
  React.useEffect(() => {
    BackgroundFetch.unregisterTaskAsync(name)
      .catch(() => {
        //noop
      })
      .then(() => {
        BackgroundFetch.registerTaskAsync(name, {
          minimumInterval: 60, // 15 minutes
          stopOnTerminate: false, // android only,
          startOnBoot: true, // android only
        })
      })
    return () => {
      BackgroundFetch.unregisterTaskAsync(name)
    }
  }, [name])
}
