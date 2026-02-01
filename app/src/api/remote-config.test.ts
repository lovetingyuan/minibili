import { test } from 'vitest'

import { getRemoteConfig } from './remote-config'
import { ConfigSchema } from './remote-config.schema'

test.skip('get-remote-config', async () => {
  const res = await getRemoteConfig()
  ConfigSchema.parse(res)
}, 20000)
