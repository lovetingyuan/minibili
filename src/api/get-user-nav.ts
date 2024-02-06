import request from './fetcher'
import { UserNavType } from './get-user-nav.schema'

export function getUserNav() {
  return request<UserNavType>('/x/web-interface/nav').then(data => {
    return data.wbi_img
  })
}
