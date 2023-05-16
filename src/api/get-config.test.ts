import { test } from 'vitest'
import { getRemoteConfig } from './get-config'
import { ConfigSchema } from './get-config.schema'

test.skip('get-remote-config', async () => {
  const res = await getRemoteConfig()
  ConfigSchema.parse(res)
})
