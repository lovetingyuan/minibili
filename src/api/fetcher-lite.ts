import { UA } from '../constants'

export function simpleRequest<D extends any>(url: string) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url
  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    origin: 'https://www.bilibili.com',
    'user-agent': UA,
  }
  const options = {
    headers,
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  } satisfies Parameters<typeof fetch>[1]
  return fetch(requestUrl, options)
    .then(r => r.json())
    .then(r => {
      return r.data as D
    })
}
