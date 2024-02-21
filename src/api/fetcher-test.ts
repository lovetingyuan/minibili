import encWbi from '../utils/wbi'
import { getCookie } from './get-cookie'
import { getUserNav } from './get-user-nav'
import type { UserNavType } from './get-user-nav.schema'

let cookie = ''

let wbiImg: UserNavType['wbi_img'] | null = null

// const getWbiImg = () => {
//   return getUserNav().then(res => {
//     wbiImg = res
//     return res
//   })
// }

export default async function request<D extends any>(url: string) {
  let requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  if (!cookie) {
    cookie = await getCookie()
  }
  if (url.includes('/wbi/')) {
    if (!wbiImg) {
      wbiImg = await getUserNav()
    }
    const [_url, _query] = requestUrl.split('?')
    const params = new URLSearchParams(_query)
    const queryParams: Record<string, string> = {}

    for (const [key, value] of params.entries()) {
      queryParams[key] = value
    }
    const query = encWbi(queryParams, wbiImg.img_url, wbiImg.sub_url)
    requestUrl = _url + '?' + query
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
    })
}
