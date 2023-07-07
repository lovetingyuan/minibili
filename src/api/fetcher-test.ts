import { UA } from '../constants'
import getCookie from './get-cookie'

let cookie = ''

export default async function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  // const { searchParams } = new URL(requestUrl)
  const isDynamic = url.includes('/x/polymer/web-dynamic/v1/feed/space')
  // if (isDynamic) {
  //   mid = searchParams.get('host_mid') || mid
  // }
  if (!cookie && isDynamic) {
    cookie = await getCookie()
  }
  // console.log(1234, cookie)
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      cookie:
        'buvid3=F43183B1-B312-92B9-5620-91EF217869BA58833infoc; b_nut=1688623058; _uuid=234859F6-5419-107CC-76D5-353845C4108D1060244infoc; buvid_fp=7deb95d2d7ae2def0691d6e5c1ae60aa; buvid4=08E0BD90-A43E-0E34-A463-35EE449A5CCD60745-023070613-iVkLZPkrhX6UaiD8BZoFTw%3D%3D; b_lsid=FD1D4736_1892E02D5BF; innersign=0; FEED_LIVE_VERSION=V8; header_theme_version=CLOSE; home_feed_column=4; browser_resolution=1392-770; PVID=1',
      'user-agent': UA,
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
      if (isDynamic && res.code === -352) {
        return {
          has_more: true,
          offset: '-352',
          items: [],
          update_baseline: '',
          update_num: 0,
        }
      }
      return res.data
    })
}
