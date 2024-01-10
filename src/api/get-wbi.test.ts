// /x/web-interface/nav
import encWbi from '../utils/wbi'
import fetcher from './fetcher-test'
import { test, assert } from 'vitest'

test('wbi-nav', async () => {
  const data: any = await fetcher(
    'https://api.bilibili.com/x/web-interface/nav',
  )
  assert.deepEqual(Object.keys(data.wbi_img), ['img_url', 'sub_url'])
  assert.ok(typeof data.wbi_img.img_url === 'string')
  assert.ok(data.wbi_img.sub_url.length > 10)
})

test('wbi-encode', async () => {
  const data: any = await fetcher(
    'https://api.bilibili.com/x/web-interface/nav',
  )
  assert.deepEqual(Object.keys(data.wbi_img), ['img_url', 'sub_url'])
  const query = encWbi(
    {
      foo: 1,
      bar: 'qq',
    },
    data.wbi_img.img_url,
    data.wbi_img.sub_url,
  )
  assert.ok(query.startsWith('bar=qq&foo=1&wts='))
  assert.ok(query.includes('&w_rid='))
  const id = query.split('&w_rid=').pop()
  assert.ok(typeof id === 'string')
  assert.ok(/^[a-z0-9]{32}$/.test(id as string))
})
