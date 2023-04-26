import { z } from 'zod'
import { configUrl } from '../constants'
import { ConfigSchema } from './get-config.schema'

export type RemoteConfig = z.infer<typeof ConfigSchema>

export const getRemoteConfig = () => {
  return fetch(configUrl + '?_t=' + Date.now())
    .then(r => r.json())
    .then((res: RemoteConfig) => {
      return res
    })
}
