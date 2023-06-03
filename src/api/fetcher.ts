import { ToastAndroid } from 'react-native'
// import { URL } from 'react-native-url-polyfill'
import { reportApiError } from '../utils/report'
// import store from '../store'
import { TracyId } from '../constants'
// import { TracyId } from '../constants'
// import getUserAgent from '../utils/user-agent'

let errorTime = Date.now()
// const Host = 'https://www.bilibili.com'
// const midKeys = ['mid', 'host_mid', 'uid', 'vmid']

export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  // const { searchParams } = new URL(requestUrl)
  // const isDynamic = pathname.startsWith('/x/polymer/web-dynamic/')
  // const midKey = midKeys.find(k => searchParams.get(k))
  // const mid = midKey ? searchParams.get(midKey) : null
  __DEV__ && console.log('request url: ', url)

  return fetch(requestUrl, {
    headers: {
      // Host,
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'user-agent':
        Math.random() >= 0.5
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      cookie: 'DedeUserID=' + TracyId, // store.cookie,
    },
    // referrer:  `https://space.bilibili.com/${mid}/dynamic` : Host,
    // referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
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
