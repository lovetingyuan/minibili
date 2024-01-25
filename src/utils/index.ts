import { Share, Platform, ToastAndroid, Alert, Linking } from 'react-native'
import Toast from 'react-native-root-toast'
import { getAppUpdateInfo } from '../store'

export const parseNumber = (num?: number | null) => {
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

export const parseUrl = (url: string) => {
  const u = url.startsWith('//') ? 'https:' + url : url
  return u.replace('http://', 'https://')
}

export function delay(ms: number) {
  return new Promise(r => {
    setTimeout(r, ms)
  })
}

const showedMessage: Record<string, () => void> = {}

export function showToast(message: string, long = false) {
  if (!(message in showedMessage)) {
    showedMessage[message] = () => {
      Platform.OS === 'android'
        ? ToastAndroid.show(
            message,
            long ? ToastAndroid.LONG : ToastAndroid.SHORT,
          )
        : Toast.show(message, {
            duration: long ? Toast.durations.LONG : Toast.durations.SHORT,
          })
    }
  }
  showedMessage[message]()
}

let showedFatalError = false

export function showFatalError(error: any) {
  if (showedFatalError || __DEV__) {
    return
  }
  getAppUpdateInfo.then(info => {
    showedFatalError = true
    Alert.alert(
      '抱歉，应用发生了错误😅',
      '我们会处理这个错误\n' +
        (error?.message || error) +
        (info.hasUpdate
          ? '\n您当前使用的是旧版应用，推荐您下载新版应用来避免错误'
          : ''),
      [
        info.hasUpdate
          ? {
              text: '下载新版',
              onPress: () => {
                Linking.openURL(info.downloadLink)
              },
            }
          : {
              text: '确定',
            },
      ],
      {
        cancelable: false,
        onDismiss() {
          showedFatalError = false
        },
      },
    )
  })
}

export function imgUrl(url: string, size?: number, h = size) {
  return (
    url.replace('http://', 'https://') +
    (typeof size === 'number' ? `@${size}w_${h}h_1c.webp` : '')
  )
}

export function openUrl(url: string) {
  Linking.openURL(url)
}
