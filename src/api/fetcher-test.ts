import { getCookie } from './get-cookie'

let cookie = ''

export default async function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  if (!cookie) {
    cookie = await getCookie()
  }
  // console.log(99, requestUrl)
  return fetch(requestUrl, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      // cookie,
      // 'sec-ch-ua':
      //   '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
      // 'sec-ch-ua-mobile': '?0',
      // 'sec-ch-ua-platform': '"Windows"',
      // 'sec-fetch-dest': 'document',
      // 'sec-fetch-mode': 'navigate',
      // 'sec-fetch-site': 'none',
      // 'sec-fetch-user': '?1',
      // 'upgrade-insecure-requests': '1',
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
  })
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
