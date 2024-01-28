import { getCookie } from './get-cookie'

let cookie = ''

export default async function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  if (!cookie) {
    cookie = await getCookie()
  }
  const options = {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      cookie,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    },
    // referrer: 'https://api.bilibili.com',
    // referrerPolicy: 'no-referrer-when-downgrade',
    referrerPolicy: 'strict-origin-when-cross-origin',
    method: 'GET',
    mode: 'cors',
    body: null,
    credentials: 'include',
  } satisfies Parameters<typeof fetch>[1]
  if (url.includes('/reply/')) {
    // @ts-ignore
    delete options.headers.cookie
    // @ts-ignore
    options.credentials = 'omit'
  }
  return fetch(requestUrl, options)
    .then(r => r.json())
    .then(res => {
      return res.data as D
      // const index = resText.indexOf('}{"code":')
      // if (index > -1) {
      //   resText = resText.substring(index + 1)
      // }
      // const res = JSON.parse(resText) as {
      //   code: number
      //   message: string
      //   data: D
      // }
      // return res.data
    })
}
