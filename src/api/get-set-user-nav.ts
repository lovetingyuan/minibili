import type { UserNavType } from './get-user-nav.schema'

// @ts-ignore
const { promise, resolve } = new (function () {
  // @ts-ignore
  this.promise = new Promise(r => (this.resolve = r))
})()

let wbiImg: UserNavType['wbi_img'] | null = null

export default function getSetWbiImg(_wbiImg?: UserNavType['wbi_img']) {
  if (_wbiImg) {
    wbiImg = _wbiImg
    resolve(wbiImg)
  } else if (!wbiImg) {
    return promise
  } else {
    return wbiImg
  }
}
