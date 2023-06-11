import { ToastAndroid } from 'react-native'
import { reportApiError } from '../utils/report'
import store from '../store'

let errorTime = Date.now()

export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  __DEV__ && console.log('request url: ', url)
  const isDynamic = url.startsWith('/x/polymer/web-dynamic/v1/feed/space')
  return fetch(requestUrl, {
    headers: {
      'cache-control': 'no-cache',
      'user-agent':
        Math.random() >= 0.5
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
      accept: 'application/json, text/plain, */*',
      cookie: store.cookie,
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
      let res = {
        code: -1,
        message: '解析json失败:' + resText,
        data: {},
      } as Res
      try {
        res = JSON.parse(resText) as Res
      } catch (err) {}
      if (res.code) {
        if (isDynamic) {
          store.showCaptcha = true
        }
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
