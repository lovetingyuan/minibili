import { Share, ToastAndroid } from 'react-native';

export async function handleShareVideo(
  name: string,
  title: string,
  bvid: string | number,
) {
  try {
    const message = title.length < 40 ? title : title.substring(0, 40) + '……';
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: [
        'MiniBili - ' + name,
        message,
        /^\d+$/.test(bvid + '')
          ? `https://m.bilibili.com/dynamic/${bvid}`
          : `https://b23.tv/${bvid}`,
      ].join('\n'),
    });
  } catch (error) {
    ToastAndroid.show('分享失败', ToastAndroid.SHORT);
  }
}

export async function handleShareUp(
  name: string,
  mid: number | string,
  sign: string,
) {
  try {
    const message = sign.length < 40 ? sign : sign.substring(0, 40) + '……';
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: [
        'MiniBili - ' + name,
        message,
        `https://m.bilibili.com/space/${mid}`,
      ].join('\n'),
    });
  } catch (error) {
    ToastAndroid.show('分享失败', ToastAndroid.SHORT);
  }
}
