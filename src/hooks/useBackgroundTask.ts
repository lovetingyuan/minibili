import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import React from 'react'

export default function useBackgroundTask(name: string, callback: () => void) {
  const BACKGROUND_FETCH_TASK = name

  // 1. Define the task by providing a name and the function that should be executed
  // Note: This needs to be called in the global scope (e.g outside of your React components)
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    // const now = Date.now()
    // console.log(
    //   `Got background fetch call at date: ${new Date(now).toISOString()}`,
    // )
    callback()
    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData
  })
  React.useEffect(() => {
    BackgroundFetch.unregisterTaskAsync(name)
      .catch(() => {
        //noop
      })
      .then(() => {
        BackgroundFetch.registerTaskAsync(name, {
          minimumInterval: 60 * 10, // 15 minutes
          stopOnTerminate: false, // android only,
          startOnBoot: true, // android only
        })
      })
    return () => {
      BackgroundFetch.unregisterTaskAsync(name)
    }
  }, [name])
}
