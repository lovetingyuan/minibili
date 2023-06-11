import NetInfo from '@react-native-community/netinfo'
import { Linking, Share, ToastAndroid } from 'react-native'
import { throttle } from 'throttle-debounce'

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

export const parseDuration = (seconds?: number | string) => {
  if (!seconds) {
    return ''
  }
  if (typeof seconds === 'string') {
    return seconds
  }
  let hour = Math.floor(seconds / 3600)
  let minute = Math.floor((seconds - hour * 3600) / 60)
  let second = seconds - hour * 3600 - minute * 60

  let hourString = hour < 10 ? '0' + hour : hour
  let minuteString = minute < 10 ? '0' + minute : minute
  let secondString = second < 10 ? '0' + second : second
  return (
    (hourString === '00' ? '' : hourString + ':') +
    minuteString +
    ':' +
    secondString
  )
}

export const openBiliVideo = async (bvid: string) => {
  const url = `bilibili://video/${bvid}`
  Linking.canOpenURL(url).then(openable => {
    if (!openable) {
      Linking.openURL(`https://b23.tv/${bvid}`)
    } else {
      Linking.openURL(url)
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
    showToast('分享失败')
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
    showToast('分享失败')
  }
}

export function isWifi() {
  return NetInfo.fetch().then(state => {
    return state.type === 'wifi'
  })
}
export async function checkWifi() {
  const wifi = await isWifi()
  if (!wifi) {
    showToast(' 请注意当前网络不是Wifi ')
  }
}

export const parseUrl = (url: string) => {
  return url.startsWith('//') ? 'https:' + url : url
}

export function delay(ms: number) {
  return new Promise(r => {
    setTimeout(r, ms)
  })
}

const showedMessage: Record<string, () => void> = {}

export function showToast(message: string, long = false) {
  if (message in showedMessage) {
    showedMessage[message]()
  } else {
    showedMessage[message] = throttle(
      2000,
      () => {
        ToastAndroid.show(
          message,
          long ? ToastAndroid.LONG : ToastAndroid.SHORT,
        )
      },
      {
        noLeading: false,
      },
    )
  }
}
