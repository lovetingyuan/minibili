import { z } from 'zod'
import { configUrl } from '../constants'
import { ConfigSchema } from './get-config.schema'

type Config = z.infer<typeof ConfigSchema>

export const getRemoteConfig = () => {
  return fetch(configUrl + '?_t=' + Date.now())
    .then(r => r.json())
    .then((res: Config) => {
      return res
    })
}
