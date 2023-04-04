import NetInfo from '@react-native-community/netinfo'
import { Linking, Share, ToastAndroid } from 'react-native'
// import * as FileSystem from 'expo-file-system'

export const parseNumber = (num?: number) => {
  if (num == null) {
    return ''
  }
  if (num < 10000) {
    return num + ''
  }
  return (num / 10000).toFixed(1) + '万'
}

export const parseDate = (time?: number | string) => {
  if (!time) {
    return ''
  }
  if (typeof time === 'string') {
    if (/^\d+$/.test(time)) {
      time = +time
    } else {
      return time
    }
  }
  if (time.toString().length === 10) {
    time = time * 1000
  }
  const date = new Date(time)
  const currentYear = new Date().getFullYear()
  let year = date.getFullYear()
  if (year === currentYear) {
    year = 0
  }
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year ? year + '-' : ''}${month}-${day}`
}

export const parseDuration = (duration: number) => {
  if (duration >= 24 * 60 * 60) {
    return `约${Math.round(duration / 60 / 60)}小时`
  }
  const date = new Date(duration * 1000)
  const hour = date.getHours() - date.getTimezoneOffset() / -60
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return [hour, minutes, seconds].filter(Boolean).join(':')
}

export const openBiliVideo = async (bvid: string) => {
  const url = `bilibili://video/${bvid}`
  Linking.canOpenURL(url).then(openable => {
    if (!openable) {
      Linking.openURL('https://m.bilibili.com/video/' + bvid)
    }
  })
}

export async function handleShareVideo(
  name: string,
  title: string,
  bvid: string | number,
) {
  try {
    const message = title.length < 40 ? title : title.substring(0, 40) + '……'
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: [
        'MiniBili - ' + name,
        message,
        /^\d+$/.test(bvid + '')
          ? `https://m.bilibili.com/dynamic/${bvid}`
          : `https://b23.tv/${bvid}`,
      ].join('\n'),
    })
  } catch (error) {
    ToastAndroid.show('分享失败', ToastAndroid.SHORT)
  }
}

export async function handleShareUp(
  name: string,
  mid: number | string,
  sign: string,
) {
  try {
    const message = sign.length < 40 ? sign : sign.substring(0, 40) + '……'
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: [
        'MiniBili - ' + name,
        message,
        `https://m.bilibili.com/space/${mid}`,
      ].join('\n'),
    })
  } catch (error) {
    ToastAndroid.show('分享失败', ToastAndroid.SHORT)
  }
}

export function isWifi() {
  return NetInfo.fetch().then(state => {
    return state.type === 'wifi'
  })
}

// export async function downloadImage(url: string) {
//   const filename = url.split('/').pop() as string
//   const downloadResumable = FileSystem.createDownloadResumable(
//     url,
//     FileSystem.documentDirectory + filename,
//     {},
//   )

//   try {
//     const { uri } = await downloadResumable.downloadAsync()
//     console.log('Finished downloading to dfd', uri)
//     ToastAndroid.show('下载完成', ToastAndroid.SHORT)
//   } catch (e) {
//     ToastAndroid.show('下载失败', ToastAndroid.SHORT)
//     console.error(e)
//   }
// }
