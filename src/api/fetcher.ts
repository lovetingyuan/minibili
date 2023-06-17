import { reportApiError } from '../utils/report'
import store from '../store'

type Res<D = any> = {
  code: number
  message: string
  data: D
}

export class ApiError extends Error {
  response: Res
  url: string
  constructor(message: string, url: string, res: Res) {
    super(message)
    this.name = 'API Error'
    this.response = res
    this.url = url
  }
}

export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url

  // __DEV__ && console.log('request url: ', url.slice(0, 150))
  const isDynamic = url.startsWith('/x/polymer/web-dynamic/v1/feed/space')
  return fetch(requestUrl, {
    headers: {
      'cache-control': 'no-cache',
      'user-agent':
        Math.random() >= 0.5
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
      accept: 'application/json, text/plain, */*',
      cookie: store.$cookie,
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
      let res = {
        code: -1,
        message: '解析json失败:' + resText,
        data: resText,
      } as Res<D>
      try {
        res = JSON.parse(resText) as Res<D>
      } catch (err) {}
      if (res.code) {
        if (isDynamic) {
          store.loadingDynamicError = true
        } else if (store.loadingDynamicError) {
          store.loadingDynamicError = false
        }
        reportApiError(url, res)

        return Promise.reject(
          new ApiError(
            '未能获取当前数据' + (__DEV__ ? ' ' + url : ''),
            url,
            res,
          ),
        )
      }
      return res.data
    })
}
