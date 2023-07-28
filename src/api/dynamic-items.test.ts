import fetcher from './fetcher-test'
import { test } from 'vitest'
import { DynamicListResponseSchema } from './dynamic-items.schema'

test('dynamic-list', async () => {
  const { data: list } = (await fetch(
    'https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1',
  ).then(r => r.json())) as any
  const mids = list.list.map((v: any) => v.owner.mid).concat([1458143131])
  const failedList: string[] = []
  const list352: string[] = []
  for (const mid of mids) {
    const url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`
    const res = await fetcher<any>(url).catch(() => null)
    if (!res) {
      list352.push('null-' + mid)
    } else {
      const result = DynamicListResponseSchema.safeParse(res)
      if (result.success === false) {
        failedList.push('zod-' + mid)
        console.log(mid + ' zod error')
        console.error(result.error)
      }
      if (res.has_more) {
        const res2 = await fetcher<any>(
          `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=${res.offset}&host_mid=${mid}&timezone_offset=-480`,
        ).catch(() => null)
        if (!res2) {
          list352.push('null2-' + mid)
        } else {
          const ret = DynamicListResponseSchema.safeParse(res2)
          if (ret.success === false) {
            failedList.push('zod2-' + mid)
            console.log(mid + ' zod2 error')
            console.error(ret.error)
          }
        }
      }
    }
  }
  failedList.length && console.log('Failed mid list:', failedList)
  list352.length && console.log('352 list: ' + list352.length, list352)
  if (failedList.length) {
    throw new Error('dynamic list failed')
  }
}, 30000)
