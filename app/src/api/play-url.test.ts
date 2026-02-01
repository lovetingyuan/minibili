import { test } from 'vitest'

import request from './fetcher'
import { PlayUrlResponseSchema } from './play-url.schema'

const sleep = () => {
  // @ts-ignore
  return new Promise((r) => setTimeout(r, 1000))
}

const testIt = async (url: string) => {
  let res
  for (let i = 0; i < 4; i++) {
    try {
      res = await request(url)
    } catch (e) {
      await sleep()
      if (i === 3) {
        throw e
      }
    }
    if (res) {
      PlayUrlResponseSchema.parse(res)
    }
  }
}
// import fs from 'node:fs'
test('get-play-url', () => {
  const url =
    '/x/player/wbi/playurl?bvid=BV1Av421r7Ur&cid=1454646853&type=mp4&qn=64&fnval=1&platform=pc&high_quality=1'
  return testIt(url)
})

test('get-play-url-2', async () => {
  return testIt(
    '/x/player/wbi/playurl?bvid=BV1SZ421y7Ae&cid=1460675026&type=mp4&qn=64&platform=pc&high_quality=1',
  )
})

test('get-play-url-html5', async () => {
  return testIt(
    '/x/player/wbi/playurl?bvid=BV1Av421r7Ur&cid=1454646853&type=mp4&qn=64&fnval=1&platform=html5&high_quality=1',
  )
})

// test('aaa', async () => {
//   const qn = [32, 64, 74, 80, 112, 116]
//   const list = {}
//   for (const q of qn) {
//     const res = await request(
//       `/x/player/wbi/playurl?bvid=BV1HH4y1h7eh&cid=1432196942&qn=${q}&fnval=16&platform=pc&high_quality=1`,
//     )
//     list[q] = res
//   }
//   fs.writeFileSync('listaaa3.json', JSON.stringify(list, null, 2))
// })
