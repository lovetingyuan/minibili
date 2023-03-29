import { z } from 'zod'
import { emojiPackage, emojiResponseSchema } from './emojis.schema'
import useSWRImmutable from 'swr/immutable'

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
  const { data, error, isValidating, isLoading } =
    useSWRImmutable<EmojiResponse>('/x/emote/user/panel/web?business=reply')
  return {
    data: getEmojis(data?.packages),
    error,
    isValidating,
    isLoading,
  }
}
