import fetcher from './fetcher'
import useSWR from 'swr'
import { z } from 'zod'

import { emojiPackage, emojiResponseSchema } from './emojis.schema'

export type EmojiPackage = z.infer<typeof emojiPackage>
const getEmojis = (pkgs?: EmojiPackage[]) => {
  const emojis: Record<
    string,
    {
      id: number
      url: string
    }
  > = {}
  pkgs?.forEach(pkg => {
    pkg.emote.forEach(emoji => {
      emojis[emoji.text] = {
        id: emoji.id,
        url: emoji.url,
      }
    })
  })
  return emojis
}

export type EmojiResponse = z.infer<typeof emojiResponseSchema>

export function useEmojiList() {
  const { data, error, isValidating, isLoading } = useSWR<EmojiResponse>(
    '/x/emote/user/panel/web?business=reply',
    fetcher,
  )
  return {
    data: getEmojis(data?.packages),
    error,
    isValidating,
    isLoading,
  }
}
