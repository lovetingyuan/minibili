import AsyncStorage from '@react-native-async-storage/async-storage'
import { getDynamicItems } from '../api/dynamic-items'

export async function checkDynamics(mid: number | string) {
  const key = `DYNAMIC_ITEM_${mid}`
  const prev = +((await AsyncStorage.getItem(key)) || 0)
  const { items } = await getDynamicItems('', mid)
  let latestTime = 0
  let latestItem = null
  for (let item of items) {
    if (item && item.time > latestTime) {
      latestTime = item.time
      latestItem = item
    }
  }
  if (!latestItem) {
    return
  }
  if (!prev) {
    await AsyncStorage.setItem(key, latestTime + '')
  } else if (latestTime !== prev) {
    return latestTime.toString()
  }
}

export async function setLatest(mid: number | string, latestTime: string) {
  const key = `DYNAMIC_ITEM_${mid}`
  await AsyncStorage.setItem(key, latestTime)
}
