import fetcher from './fetcher-test'
import { test } from 'vitest'
import { DynamicListResponseSchema } from './dynamic-items.schema'

test('dynamic-list', async () => {
  const { data: list } = (await fetch(
    'https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1',
  ).then(r => r.json())) as any
  const mids = list.list.map((v: any) => v.owner.mid).concat([14427395])
  const failedList: string[] = []
  for (const mid of mids) {
    const res = await fetcher<any>(
      `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`,
    ).catch(() => {
      failedList.push(mid)
    })
    try {
      DynamicListResponseSchema.parse(res)
    } catch {
      failedList.push(mid)
    }
  }
  // eslint-disable-next-line no-console
  console.log('Failed mid list:', failedList)
  if (Object.keys(failedList).length) {
    throw new Error('dynamic list failed')
  }
}, 10000)
