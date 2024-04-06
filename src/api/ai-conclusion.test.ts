import { describe, test } from 'vitest'

import { AiConclusionSchema } from './ai-conclusion.schema'
import fetcher from './fetcher'

describe('ai-conclusion-test', () => {
  test('ai-conclusion', async () => {
    const res = await fetcher<any>(
      '/x/web-interface/view/conclusion/get?bvid=BV1yH4y1W7BG&cid=1471473765&up_mid=452412746',
    )

    AiConclusionSchema.parse(res)
  })
})
