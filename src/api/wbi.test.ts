import encWbi from '../utils/wbi'
import fetcher from './fetcher-test'
import { test, assert } from 'vitest'

const querys = [
  ['oid', '750721856'],
  ['type', '1'],
  ['mode', '3'],
  ['pagination_str', '{"offset":""}'],
  ['plat', '1'],
  ['seek_rpid', ''],
  ['web_location', '1315875'],
  // ['w_rid', '154ee21628c4026eb397b14c3dbda3e2'],
  // ['wts', '1706280981'],
]

test('wbi-generate', async () => {
  const data: any = await fetcher(
    'https://api.bilibili.com/x/web-interface/nav',
  )
  const query = encWbi(
    querys.reduce((a, b) => {
      // @ts-ignore
      a[b[0]] = b[1]
      return a
    }, {}),
    data.wbi_img.img_url,
    data.wbi_img.sub_url,
  )
  assert.ok(/w_rid=[a-z0-9]{32}$/.test(query))
  console.log(query)
})
