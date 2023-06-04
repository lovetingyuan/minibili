export default function request<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  // const { origin, hostname } = new URL(requestUrl)
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      // authority: host,
      // host: hostname,
      // origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      cookie: 'DedeUserID=14427395',
      // 'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    },
    // referrer: referer || 'https://space.bilibili.com',
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
      return res.data
    })
}
