// function getuuid() {
//   var e = a(8),
//     t = a(4),
//     r = a(4),
//     n = a(4),
//     o = a(12),
//     i = Date.now()
//   return (
//     e +
//     '-' +
//     t +
//     '-' +
//     r +
//     '-' +
//     n +
//     '-' +
//     o +
//     s((i % 1e5).toString(), 5) +
//     'infoc'
//   )
// }

// function a(e: number) {
//   for (var t = '', r = 0; r < e; r++) {
//     t += o(16 * Math.random())
//   }
//   return s(t, e)
// }
// function s(e: string, t: number) {
//   var r = ''
//   if (e.length < t) {
//     for (var n = 0; n < t - e.length; n++) {
//       r += '0'
//     }
//   }
//   return r + e
// }
// function o(e: number) {
//   return Math.ceil(e).toString(16).toUpperCase()
// }

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'

function getCookie(mid: string) {
  // return 'C4C1FACA-CCF4-AA5B-61F0-93D154A0979F97177infoc'
  // return fetch('https://api.bilibili.com/x/frontend/finger/spi', {
  //   headers: {
  //     accept: '*/*',
  //     'accept-language': 'zh-CN,zh;q=0.9',
  //     'cache-control': 'no-cache',
  //     pragma: 'no-cache',
  //     'sec-ch-ua':
  //       '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
  //     'sec-ch-ua-mobile': '?0',
  //     'sec-ch-ua-platform': '"macOS"',
  //     'sec-fetch-dest': 'empty',
  //     'sec-fetch-mode': 'cors',
  //     'sec-fetch-site': 'same-origin',
  //   },
  //   referrer: 'https://api.bilibili.com/x/frontend/finger/spi',
  //   referrerPolicy: 'strict-origin-when-cross-origin',
  //   body: null,
  //   method: 'GET',
  //   mode: 'cors',
  //   credentials: 'omit',
  // })
  //   .then(res => res.json())
  //   .then(res => {
  //     const id = `buvid4=${res.data.b_4.replaceAll('=', '%3D')}; buvid3=${
  //       res.data.b_3
  //     }`
  //     console.log(1234, id)
  //     return id
  //   })
  return fetch('https://space.bilibili.com/' + mid + '/dynamic', {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': UA,
      'sec-ch-ua':
        '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    },
    referrer: 'https://www.bilibili.com/',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  })
    .then(response => {
      const cookie = response.headers.get('Set-Cookie') || ''
      if (cookie) {
        // console.log(222, cookie)
        const cookies = cookie.split('; ')
        const id = cookies.find(v => v.startsWith('buvid3='))
        return id || ''
      }
      return ''
    })
    .catch(() => {
      return ''
    })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cookie = ''
// getCookie()

export default async function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  const { searchParams } = new URL(requestUrl)
  const isDynamic = url.includes('/x/polymer/web-dynamic/v1/feed/space')
  // if (isDynamic) {
  //   mid = searchParams.get('host_mid') || mid
  // }
  if (isDynamic) {
    cookie = await getCookie(searchParams.get('host_mid')!)
    // console.log(1234, cookie)
  }
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      // cookie,
      cookie: 'buvid3=CED70C29-758A-B176-7961-8F8EFE2E651D82318infoc',
      // CED70C29-758A-B176-7961-8F8EFE2E651D82318infoc
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
      // if (isDynamic) {
      //   console.log(res.code)
      // }
      return res.data
    })
}
