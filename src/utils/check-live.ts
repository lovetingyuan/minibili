import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
// import { checkLivingUps } from '../api/living-info'
// import store from '../store'

const CHECK_LIVING_UPS = 'check-living-ups'

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(CHECK_LIVING_UPS, async () => {
  // const now = Date.now();
  // console.log(4353453453)
  // store.testid++
  // console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);
  // await checkLivingUps()
  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData
})

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function registerCheckLivingUps() {
  return BackgroundFetch.registerTaskAsync(CHECK_LIVING_UPS, {
    minimumInterval: 60 * 10, // 10 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  }).then(() => {
    return isCheckLivingUpsTaskGood()
  })
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function unregisterCheckLivingUps() {
  return BackgroundFetch.unregisterTaskAsync(CHECK_LIVING_UPS)
}

async function isCheckLivingUpsTaskGood() {
  const status = await BackgroundFetch.getStatusAsync()
  const isRegistered = await TaskManager.isTaskRegisteredAsync(CHECK_LIVING_UPS)
  return (
    status === BackgroundFetch.BackgroundFetchStatus.Available && isRegistered
  )
}
