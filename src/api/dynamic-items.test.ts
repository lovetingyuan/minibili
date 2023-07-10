import fetcher from './fetcher-test'
import { test } from 'vitest'
import { DynamicListResponseSchema } from './dynamic-items.schema'

test('dynamic-list', async () => {
  const { data: list } = (await fetch(
    'https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1',
  ).then(r => r.json())) as any
  const mids = list.list.map((v: any) => v.owner.mid).concat([14427395])
  const failedList: string[] = []
  const list352: string[] = []
  let count = 0
  for (const mid of mids) {
    let res = null
    for (let i = 0; i < 10; i++) {
      res = await fetcher<any>(
        `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`,
      ).catch(() => null)
      if (res) {
        break
      }
    }
    if (!res) {
      list352.push('null-' + mid)
    } else {
      const result = DynamicListResponseSchema.safeParse(res)
      if (result.success === false) {
        failedList.push('zod-' + mid)
        console.log(mid + ' zod error')
        console.error(result.error)
      } else {
        console.log(++count + ' success', mid)
      }
    }
  }
  failedList.length && console.log('Failed mid list:', failedList)
  list352.length && console.log('352 list: ' + list352.length, list352)
  if (failedList.length) {
    throw new Error('dynamic list failed')
  }
}, 15000)
