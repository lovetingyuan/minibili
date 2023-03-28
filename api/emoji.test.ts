import { test } from 'vitest'
import { emojiResponseSchema } from './emojis.schema'
import fetcher from './fetcher-test'

test('emoji-list', async () => {
  const res = await fetcher(
    'https://api.bilibili.com/x/emote/user/panel/web?business=reply',
  )
  emojiResponseSchema.parse(res)
})
