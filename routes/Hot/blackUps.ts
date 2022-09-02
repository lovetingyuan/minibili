import AsyncStorage from '@react-native-async-storage/async-storage';

let blackUps: Record<string, string> = {};

export const getBlackUps = Object.keys(blackUps).length
  ? Promise.resolve(blackUps)
  : AsyncStorage.getItem('BLACK_LIST').then(data => {
      blackUps = JSON.parse(data || '{}');
      __DEV__ && console.log('__BLACKLIST__', blackUps);
      return blackUps;
    });

export const addBlackUser = async (userId: number, userName: string) => {
  await getBlackUps;
  blackUps[userId] = userName;
  await AsyncStorage.setItem('BLACK_LIST', JSON.stringify(blackUps));
  return blackUps;
};

export const isBlackUp = async (mid: number) => {
  await getBlackUps;
  return mid in blackUps;
};
