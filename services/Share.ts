import { Share, ToastAndroid } from 'react-native';

export default async function handleShare(
  name: string,
  title: string,
  bvid: string,
) {
  try {
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: ['MiniBili - ' + name, title, `https://b23.tv/${bvid}`].join(
        '\n',
      ),
    });
  } catch (error) {
    ToastAndroid.show('分享失败', ToastAndroid.SHORT);
  }
}
