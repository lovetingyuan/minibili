import * as protobuf from 'protobufjs'
import { assert, test } from 'vitest'

import dm from '../constants/dm'
import { DanmakuSchema } from './get-danmaku.schema'

const root = protobuf.Root.fromJSON(dm)

const lp = root.lookupType('DmSegMobileReply')

test('get-danmaku', async () => {
  const arrayBuffer = await fetch(
    'https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=1459734495&pid=1001385310&segment_index=1',
  ).then(res => {
    return res.arrayBuffer()
  })

  const bytes = new Uint8Array(arrayBuffer)

  const message = lp.decode(bytes)
  const objects = lp.toObject(message, {
    // bool: Boolean,
    longs: Number,
    enums: Number,
    bytes: String,
    // Object: String,
  })
  assert.ok(Array.isArray(objects.elems))
  DanmakuSchema.parse(objects.elems[0])
  DanmakuSchema.parse(objects.elems[10])
})
