// import request from './fetcher'
import { simpleRequest } from './fetcher-lite'
import type { UserNavType } from './user-nav.schema'

export function getUserNav() {
  return simpleRequest<UserNavType>('/x/web-interface/nav')
}

let wbiImage: UserNavType['wbi_img'] | null = null

export function getWBIInfo() {
  if (wbiImage) {
    return Promise.resolve(wbiImage)
  }
  return getUserNav().then(data => {
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
