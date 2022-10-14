import AsyncStorage from '@react-native-async-storage/async-storage';

let blackTags: Record<string, boolean> = {};

export const getBlackTags = Object.keys(blackTags).length
  ? Promise.resolve(blackTags)
  : AsyncStorage.getItem('BLACK_LTAGS').then(data => {
      blackTags = JSON.parse(data || '{}');
      __DEV__ && console.log('__BLACKTAGS__', blackTags);
      return blackTags;
    });

export const addBlackTag = async (tag: string) => {
  await getBlackTags;
  blackTags[tag] = true;
  await AsyncStorage.setItem('BLACK_LTAGS', JSON.stringify(blackTags));
  return blackTags;
};

export const isBlackTag = async (tag: string) => {
  await getBlackTags;
  return tag in blackTags;
};
