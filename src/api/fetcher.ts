import { ToastAndroid } from 'react-native'
import { URL } from 'react-native-url-polyfill'
import * as SentryExpo from 'sentry-expo'

let errorTime = Date.now()

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=326081112&timezone_offset=-480
export default function request<D extends any>(url: string, referer?: string) {
  __DEV__ && console.log('request url: ', url)
  const requestUrl = url.startsWith('http')
    ? url
    : 'http://api.bilibili.com' + url
  const { origin, hostname } = new URL(requestUrl)
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      // authority: host,
      // referer: 'https://api.bilibili.com/',
      host: hostname,
      origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Chromium";v="104", " Not A;Brand";v="99", "Microsoft Edge";v="104"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      // 'upgrade-insecure-requests': '1',
      'user-agent': 'BiLiBiLi ANDROID Client/8.0.0 (orz@****.my)',
    },
    referrer: referer || 'https://space.bilibili.com',
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    // credentials: 'omit',
    credentials: 'include',
  })
    .then(r => r.json())
    .then((res: { code: number; message: string; data: D }) => {
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
        const errMsg = JSON.stringify({
          url,
          code: res.code,
          message: res.message,
        })
        SentryExpo.Native.captureMessage(errMsg, {
          tags: {
            category: 'api-error',
          },
          extra: {
            url,
            code: res.code,
            message: res.message,
          },
        })
        SentryExpo.Native.captureEvent()
        throw new Error('未能获取当前数据' + (__DEV__ ? ' ' + errMsg : ''))
      }
      return res.data
    })
}
