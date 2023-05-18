export default function request<D extends any>(url: string, referer?: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  const { origin, hostname } = new URL(requestUrl)
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      // authority: host,
      host: hostname,
      origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Chromium";v="104", " Not A;Brand";v="99", "Microsoft Edge";v="104"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      // 'upgrade-insecure-requests': '1',
      'user-agent': 'BiLiBiLi ANDROID Client/8.0.0 (orz@****.my)',
    },
    referrer: referer || 'https://space.bilibili.com',
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    // credentials: 'omit',
    credentials: 'include',
  })
    .then(r => r.text())
    .then(resText => {
      const index = resText.indexOf('}{"code":')
      if (index > -1) {
        resText = resText.substring(index + 1)
      }
      const res: { code: number; message: string; data: D } =
        JSON.parse(resText)
      return res.data
    })
}
