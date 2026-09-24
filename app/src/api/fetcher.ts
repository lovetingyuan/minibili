// import * as protobuf from 'protobufjs'

import { UA } from '../constants';
import { isBilibiliAuthExpiredCode, reportBilibiliAuthExpired } from '../features/bilibili-session/auth-expiration';
import { showLoginRequiredAlert } from '../features/bilibili-session/login-required-alert';
// import dm from '../constants/dm'
import encWbi from '../utils/wbi';
import bilibiliFetch from './bilibili-fetch';
import { stringifyCommentOid } from './comment-json.helpers';
import { getWBIInfo } from './user-nav';

type ResponseType<D = any> = {
  code: number;
  message: string;
  data: D;
};

class ApiError extends Error {
  response: ResponseType;
  url: string;
  code: number;
  constructor(message: string, url: string, res: ResponseType) {
    super(message);
    this.name = 'API Error';
    this.response = res;
    this.url = url;
    this.code = res.code;
  }
}

export type RequestOptions = { withCookie?: boolean };

/** nav 是 wbi 签名的前置请求，登录态对它不构成错误，见下方错误码分支 */
const NAV_URL = '/x/web-interface/nav';

export function shouldSignWbiRequest(url: string) {
  return (
    url.includes('/wbi/') ||
    url.includes('/x/polymer/web-dynamic/v1/feed/space') ||
    url.includes('/x/polymer/web-dynamic/v1/opus/feed/space')
  );
}

// const root = protobuf.Root.fromJSON(dm as any)
// const lp = root.lookupType('DmSegMobileReply')

if (typeof __DEV__ === 'undefined') {
  try {
    // @ts-ignore
    globalThis.__DEV__ = false;
  } catch {}
}

export default async function request<D>(url: string, requestOptions: RequestOptions = {}): Promise<D> {
  let requestUrl = url.startsWith('http') ? url : `https://api.bilibili.com${url}`;
  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.log('request url: ', url.slice(0, 150));
  }
  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    // 'sec-fetch-dest': 'empty',
    // 'sec-fetch-mode': 'cors',
    // 'sec-fetch-site': 'same-site',
    origin: 'https://www.bilibili.com',
    referer: 'https://space.bilibili.com',
    'user-agent': UA, // 'user-agent': 'Mozilla/5.0',
  };
  const options = {
    headers,
    // referrerPolicy: 'no-referrer-when-downgrade',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  } satisfies Parameters<typeof fetch>[1];
  if (shouldSignWbiRequest(url)) {
    const wbiImg = await getWBIInfo(request);
    const [_url, _query] = requestUrl.split('?');
    const params = new URLSearchParams(_query);
    const queryParams: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      queryParams[key] = value;
    }
    const query = await encWbi(queryParams, wbiImg?.img_url, wbiImg?.sub_url);
    requestUrl = `${_url}?${query}`;
  }
  // if (url.includes('/dm/web/seg.so')) {
  //   const arrayBuffer = await fetch(requestUrl, options).then(r =>
  //     r.arrayBuffer(),
  //   )
  //   const bytes = new Uint8Array(arrayBuffer)

  //   const message = lp.decode(bytes)
  //   const objects = lp.toObject(message, {
  //     // bool: Boolean,
  //     longs: Number,
  //     enums: Number,
  //     bytes: String,
  //     // Object: String,
  //   })
  //   return objects.elems
  // }
  let resText = await bilibiliFetch(requestUrl, options, requestOptions.withCookie !== false).then((r) => r.text());
  const index = resText.indexOf('}{"code":');
  if (index > -1) {
    resText = resText.substring(index + 1);
  }
  let res = {
    code: -1,
    message: `解析json失败:${resText}`,
    data: resText,
  } as ResponseType<D>;
  try {
    if (url.includes('/x/v2/reply/')) {
      // oid这个属性是数字但是会溢出，所以这里处理成字符串
      resText = stringifyCommentOid(resText);
    }
    res = JSON.parse(resText) as ResponseType<D>;
  } catch {
    // ignore
  }
  if (isBilibiliAuthExpiredCode(res.code)) {
    const expired = reportBilibiliAuthExpired(res.code, res.message, url);
    if (url === NAV_URL) {
      // nav 无论登没登录都会返回 wbi_img，-101 只表示「没登录」而不是请求失败：
      // 抛错会让所有 wbi 请求一起失败，所以这里只引导登录，data 继续往下返回。
      showLoginRequiredAlert('登录 B站 后即可使用完整功能');
    } else {
      throw expired;
    }
  }
  // if (url === '/x/web-interface/nav') {
  //   return res.data
  // }
  if (res.code && url !== NAV_URL) {
    // reportApiError(url, res)
    if (__DEV__) {
      // 用 log 而不是 error：接口失败已经有页面提示，error 会再弹一层 LogBox 挡住界面
      // oxlint-disable-next-line no-console
      console.log('api error', res.code, res.message, url.slice(0, 150));
    }
    return Promise.reject(new ApiError(`${res.code}:${res.message} ${url}`, url, res));
  }
  return res.data;
}
