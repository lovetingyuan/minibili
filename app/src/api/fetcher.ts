// import * as protobuf from 'protobufjs'

import { UA } from "../constants";
// import dm from '../constants/dm'
import encWbi from "../utils/wbi";
import bilibiliFetch from "./bilibili-fetch";
import { stringifyCommentOid } from "./comment-json.helpers";
import { getWBIInfo } from "./user-nav";

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
    this.name = "API Error";
    this.response = res;
    this.url = url;
    this.code = res.code;
  }
}

export type RequestOptions = { withCookie?: boolean };

// const root = protobuf.Root.fromJSON(dm as any)
// const lp = root.lookupType('DmSegMobileReply')

if (typeof __DEV__ === "undefined") {
  try {
    // @ts-ignore
    globalThis.__DEV__ = false;
  } catch {}
}

export default async function request<D>(
  url: string,
  requestOptions: RequestOptions = {},
): Promise<D> {
  let requestUrl = url.startsWith("http") ? url : `https://api.bilibili.com${url}`;
  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.log("request url: ", url.slice(0, 150));
  }
  const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    // 'sec-fetch-dest': 'empty',
    // 'sec-fetch-mode': 'cors',
    // 'sec-fetch-site': 'same-site',
    origin: "https://www.bilibili.com",
    referer: "https://space.bilibili.com",
    "user-agent": UA, // 'user-agent': 'Mozilla/5.0',
  };
  const options = {
    headers,
    // referrerPolicy: 'no-referrer-when-downgrade',
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  } satisfies Parameters<typeof fetch>[1];
  if (url.includes("/wbi/") || url.includes("v1/feed/space")) {
    const wbiImg = await getWBIInfo(request);
    const [_url, _query] = requestUrl.split("?");
    const params = new URLSearchParams(_query);
    const queryParams: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      queryParams[key] = value;
    }
    const query = encWbi(queryParams, wbiImg?.img_url, wbiImg?.sub_url);
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
  let resText = await bilibiliFetch(requestUrl, options, requestOptions.withCookie !== false).then(
    (r) => r.text(),
  );
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
    if (url.includes("/x/v2/reply/")) {
      // oid这个属性是数字但是会溢出，所以这里处理成字符串
      resText = stringifyCommentOid(resText);
    }
    res = JSON.parse(resText) as ResponseType<D>;
  } catch {
    // ignore
  }
  // if (url === '/x/web-interface/nav') {
  //   return res.data
  // }
  if (res.code && url !== "/x/web-interface/nav") {
    // reportApiError(url, res)
    if (__DEV__) {
      // oxlint-disable-next-line no-console
      console.error(url, res);
    }
    return Promise.reject(new ApiError(`${res.code}:${res.message} ${url}`, url, res));
  }
  return res.data;
}
