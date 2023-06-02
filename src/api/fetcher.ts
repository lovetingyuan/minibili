import { ToastAndroid } from 'react-native'
import { URL } from 'react-native-url-polyfill'
import { reportApiError } from '../utils/report'
import store from '../store'
import { TracyId } from '../constants'
// import getUserAgent from '../utils/user-agent'

let errorTime = Date.now()
const Host = 'https://www.bilibili.com'

export default function request<D extends any>(url: string) {
  __DEV__ && console.log('request url: ', url, store.cookie)
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  const { pathname, searchParams } = new URL(requestUrl)
  const isDynamic = pathname.startsWith('/x/polymer/web-dynamic/')
  return fetch(requestUrl, {
    headers: {
      // Host,
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      // Connection: 'keep-alive',
      // 'Upgrade-Insecure-Requests': '1',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      // origin: isDynamic ? 'https://space.bilibili.com' : Host,
      ...(isDynamic
        ? {
            cookie: store.cookie
              ? store.cookie + `; DedeUserID=${searchParams.get('host_mid')}`
              : `DedeUserID=${searchParams.get('host_mid')}`,
          }
        : {}),
      // Referer: isDynamic
      //   ? `https://space.bilibili.com/${
      //       store.$userInfo?.mid || TracyId
      //     }/dynamic`
      //   : Host,
      // 'Referrer-Policy': 'no-referrer-when-downgrade',
    },
    referrer: isDynamic
      ? `https://space.bilibili.com/${store.$userInfo?.mid || TracyId}/dynamic`
      : Host,
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    method: 'GET',
    mode: 'cors',
    credentials: store.cookie ? 'include' : 'omit',
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
