import { ToastAndroid } from 'react-native'
import { reportApiError } from '../utils/report'
import { TracyId } from '../constants'

let errorTime = Date.now()

export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  __DEV__ && console.log('request url: ', url)

  return fetch(requestUrl, {
    headers: {
      'cache-control': 'no-cache',
      'user-agent':
        Math.random() >= 0.5
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
      accept: 'application/json, text/plain, */*',
      cookie:
        'buvid3=E9C0E505-0644-BC4E-A960-740A6166CBC075011infoc; b_nut=1685789374; buvid4=C33718F6-D8A0-286A-4F19-EB6B305FD25A75011-023060318-enaZs54a++8bjtVng+D1dQ%3D%3D; b_lsid=3B75A2D9_18880EF23FB; _uuid=FB83110AC-CD1F-E6FE-5BF10-52C8BAC41034D36016infoc; buvid_fp=ad1eba0849bea0f4777ca8a8070f986a; x-bili-gaia-vtoken=036dae5877c14c5c8d63fdb37ea3d8d0', // 'DedeUserID=' + TracyId, // store.cookie,
    },
    method: 'GET',
    mode: 'cors',
    credentials: 'include', //: 'omit',
  })
    .then(r => r.text())
    .then(resText => {
      const index = resText.indexOf('}{"code":')
      if (index > -1) {
        resText = resText.substring(index + 1)
      }
      type Res = {
        code: number
        message: string
        data: D
      }
      let res = {} as Res
      try {
        res = JSON.parse(resText) as Res
      } catch (err) {
        reportApiError({
          url,
          code: -1,
          message: 'Failed to JSON.parse(response): ' + resText,
          method: 'GET',
        })
      }
      if (res.code) {
        if (__DEV__) {
          ToastAndroid.show(
            ` 数据获取失败:${url}, ${res.code} ${res.message}`,
            ToastAndroid.SHORT,
          )
          console.log('error', url, res.code, res.message)
        } else if (Date.now() - errorTime > 10000) {
          ToastAndroid.show(' 数据获取失败 ', ToastAndroid.SHORT)
          errorTime = Date.now()
        }
        reportApiError({
          url,
          code: res.code,
          message: res.message,
          method: 'GET',
        })
        return Promise.reject(
          new Error('未能获取当前数据' + (__DEV__ ? ' ' + url : '')),
        )
      }
      return res.data
    })
}
