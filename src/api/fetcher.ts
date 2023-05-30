import { ToastAndroid } from 'react-native'
import { URL } from 'react-native-url-polyfill'
import { reportApiError } from '../utils/report'
// import getUserAgent from '../utils/user-agent'

let errorTime = Date.now()

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=326081112&timezone_offset=-480
export default function request<D extends any>(url: string, referer?: string) {
  // __DEV__ && console.log('request url: ', url)
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  const { origin, hostname } = new URL(requestUrl)
  return fetch(requestUrl + '&__t=' + Date.now(), {
    headers: {
      // authority: host,
      // referer: 'https://api.bilibili.com/',
      host: hostname,
      origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      // 'sec-ch-ua-mobile': '?1',
      // 'sec-ch-ua-platform': '"Android"',
      // 'sec-fetch-dest': 'empty',
      // 'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      // 'upgrade-insecure-requests': '1',
      // 'user-agent': getUserAgent(),
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'sec-ch-ua':
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
      TE: 'trailers',
      // 'user-agent': getUserAgent(3),
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50',
    },
    referrer: referer || 'https://space.bilibili.com',
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    // credentials: 'include',
  })
    .then(r => r.text())
    .then(resText => {
      const index = resText.indexOf('}{"code":')
      if (index > -1) {
        resText = resText.substring(index + 1)
      }
      const res = JSON.parse(resText) as {
        code: number
        message: string
        data: D
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
        })
        return Promise.reject(
          new Error('未能获取当前数据' + (__DEV__ ? ' ' + url : '')),
        )
      }
      return res.data
    })
}

// GET /x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=14427395&timezone_offset=-480&features=itemOpusStyle HTTP/2
// Host: api.bilibili.com
// User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0
// Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
// Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
// Accept-Encoding: gzip, deflate, br
// Connection: keep-alive
// Upgrade-Insecure-Requests: 1
// Sec-Fetch-Dest: document
// Sec-Fetch-Mode: navigate
// Sec-Fetch-Site: none
// Sec-Fetch-User: ?1
// TE: trailers
