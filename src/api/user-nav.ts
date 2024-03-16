// import request from './fetcher'
// import { simpleRequest } from './fetcher-lite'
import type { UserNavType } from './user-nav.schema'

//https://api.bilibili.com/x/web-interface/nav
let wbiImage: UserNavType['wbi_img'] | null = null

export function getWBIInfo(request: <T>(url: string) => Promise<T>) {
  if (wbiImage) {
    return wbiImage
  }
  return request<UserNavType>('/x/web-interface/nav').then(data => {
    wbiImage = data.wbi_img
    return wbiImage
  })
}

setInterval(
  () => {
    wbiImage = null
  },
  12 * 60 * 1000 * 1000,
)
