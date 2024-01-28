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

  // eslint-disable-next-line no-console
  __DEV__ && console.log('request url: ', url.slice(0, 150))
  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    // 'sec-fetch-dest': 'empty',
    // 'sec-fetch-mode': 'cors',
    // 'sec-fetch-site': 'same-site',
    // Cookie: '',
    cookie,
    origin: 'https://www.bilibili.com',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    // 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    // 'user-agent': 'Mozilla/5.0',
  }
  const options = {
    headers,
    // referrerPolicy: 'no-referrer-when-downgrade',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  } satisfies Parameters<typeof fetch>[1]
  if (url.includes('/reply/')) {
    // @ts-ignore
    delete headers.cookie
    // @ts-ignore
    options.credentials = 'omit'
  }
  return fetch(requestUrl, options)
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
        if (url.includes('/x/v2/reply/wbi/main?')) {
          // oid这个属性是数字但是会溢出，所以这里处理成字符串
          resText = resText.replaceAll(/"oid":(\d+),"/g, (_, num) => {
            return `"oid":"${num}","`
          })
        }
        res = JSON.parse(resText) as Res<D>
      } catch (err) {}
      if (url === '/x/web-interface/nav') {
        return res.data
      }
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
