import * as protobuf from 'protobufjs'

import { UA } from '../constants'
import dm from '../constants/dm'
import encWbi from '../utils/wbi'
import { getCookie } from './get-cookie'
import getSetWbiImg from './get-set-user-nav'

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

getCookie().then(c => {
  cookie = c
})

const root = protobuf.Root.fromJSON(dm as any)
const lp = root.lookupType('DmSegMobileReply')

export default async function request<D extends any>(url: string) {
  let requestUrl = url.startsWith('http')
    ? url
    : 'https://api.bilibili.com' + url

  // __DEV__ && console.log('request url: ', url.slice(0, 150))
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
    'user-agent': UA, // 'user-agent': 'Mozilla/5.0',
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
  if (url.includes('/wbi/')) {
    const wbiImg = await getSetWbiImg()
    const [_url, _query] = requestUrl.split('?')
    const params = new URLSearchParams(_query)
    const queryParams: Record<string, string> = {}

    for (const [key, value] of params.entries()) {
      queryParams[key] = value
    }
    const query = encWbi(queryParams, wbiImg.img_url, wbiImg.sub_url)
    requestUrl = _url + '?' + query
  }
  if (url.includes('/dm/web/seg.so')) {
    const arrayBuffer = await fetch(requestUrl, options).then(r =>
      r.arrayBuffer(),
    )
    const bytes = new Uint8Array(arrayBuffer)

    const message = lp.decode(bytes)
    const objects = lp.toObject(message, {
      // bool: Boolean,
      longs: Number,
      enums: Number,
      bytes: String,
      // Object: String,
    })
    return objects.elems
  }
  let resText = await fetch(requestUrl, options).then(r => r.text())

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
    // reportApiError(url, res)

    return Promise.reject(
      new ApiError('未能获取当前数据' + (__DEV__ ? ' ' + url : ''), url, res),
    )
  }
  return res.data
}
