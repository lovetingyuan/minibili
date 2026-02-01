import { assert, test } from 'vitest'

import request from '../api/fetcher'
import { getWBIInfo } from '../api/user-nav'
import encWbi from './wbi'

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
  const data: any = await getWBIInfo(request)
  const query = encWbi(
    querys.reduce((a, b) => {
      // @ts-ignore
      a[b[0]] = b[1]
      return a
    }, {}),
    data.img_url,
    data.sub_url,
  )
  assert.ok(/w_rid=[a-z0-9]{32}$/.test(query))
  // console.log(query)
})
