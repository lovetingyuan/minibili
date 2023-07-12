import { test } from 'vitest'
import { getRemoteConfig } from './get-config'
import { ConfigSchema } from './get-config.schema'

test('get-remote-config', async () => {
  const res = await getRemoteConfig()
  ConfigSchema.parse(res)
}, 10000)
