// import { UA } from '../constants'
// import getCookie from './get-cookie'

import { getCookie } from './get-cookie'

let cookie = ''

export default async function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  // const { searchParams } = new URL(requestUrl)
  // const isDynamic = url.includes('/x/polymer/web-dynamic/v1/feed/space')
  // if (isDynamic) {
  //   mid = searchParams.get('host_mid') || mid
  // }
  // if (!cookie && isDynamic) {
  //   cookie = await getCookie()
  // }
  // console.log(1234, cookie)
  if (!cookie) {
    cookie = await getCookie()
  }
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      cookie,
      'user-agent': 'Mozilla/5.0',
    },
    // referrer: 'https://space.bilibili.com',
    // referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
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
      const res = JSON.parse(resText) as {
        code: number
        message: string
        data: D
      }
      // if (isDynamic && res.code === -352) {
      //   return {
      //     has_more: true,
      //     offset: '-352',
      //     items: [],
      //     update_baseline: '',
      //     update_num: 0,
      //   }
      // }
      return res.data
    })
}
