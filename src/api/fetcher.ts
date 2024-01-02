import { reportApiError } from '../utils/report'
import { getCookie } from './get-cookie'

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
let cookie = ''

if (!cookie) {
  getCookie().then(c => {
    cookie = c
  })
}

export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url

  __DEV__ && console.log('request url: ', url.slice(0, 150))
  // console.log(444, requestUrl)
  return fetch(requestUrl, {
    headers: {
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json, text/plain, */*',
      cookie,
    },
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
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
        if (url.includes('/x/v2/reply/main?')) {
          // oid这个属性是数字但是会溢出，所以这里处理成字符串
          resText = resText.replaceAll(/"oid":(\d+),"/g, (_, num) => {
            return `"oid":"${num}","`
          })
        }
        res = JSON.parse(resText) as Res<D>
      } catch (err) {}
      if (res.code) {
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
