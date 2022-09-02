import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDynamicItems } from './Bilibili';

const latestMap: Record<string, number> = {};

export async function checkDynamics(mid: number) {
  const key = `DYNAMIC_ITEM_${mid}`;
  const prev = +((await AsyncStorage.getItem(key)) || 0);
  const { items } = await getDynamicItems('', mid);
  let latestTime = 0;
  let latestItem = null;
  for (let item of items) {
    if (item && item.time > latestTime) {
      latestTime = item.time;
      latestItem = item;
    }
  }
  if (!latestItem) {
    return;
  }
  if (prev === null) {
    latestMap[mid] = latestTime;
    await AsyncStorage.setItem(key, latestTime + '');
  } else if (latestTime !== prev) {
    latestMap[mid] = latestTime;
    return latestTime;
  }
}

export async function setLatest(mid: number) {
  const key = `DYNAMIC_ITEM_${mid}`;
  if (latestMap[mid]) {
    await AsyncStorage.setItem(key, latestMap[mid] + '');
  }
}
