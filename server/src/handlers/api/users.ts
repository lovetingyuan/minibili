import { getBearerToken, getUserStorage, normalizeEmail, parseSyncOperations, readJsonBody } from '../../utils/request'
import type { AppContext } from '../../types'

// 用户同步接口只接受白名单字段，并要求 Bearer token 与邮箱绑定的会话匹配。
async function handleSyncUser(c: AppContext) {
  const emailParam = c.req.param('email')
  const email = emailParam ? normalizeEmail(emailParam) : null
  if (!email) {
    return c.json({ error: 'Invalid email', success: false }, 400)
  }

  const authorization = c.req.header('authorization')
  const token = getBearerToken(authorization)
  if (!token) {
    return c.json({ error: 'Unauthorized', success: false }, 401)
  }

  const operations = parseSyncOperations(await readJsonBody(c))
  if (!operations) {
    return c.json({ error: 'Invalid sync payload', success: false }, 400)
  }

  const store = getUserStorage(c, email)
  const verifyResult = await store.verifyToken(token)
  if (!verifyResult.valid) {
    return c.json({ error: 'Unauthorized', success: false }, 401)
  }

  try {
    const result = await store.syncData(operations)
    return c.json({ result, success: true })
  } catch (error) {
    // 存储层会抛出不支持的 key 等业务错误，这里统一转成 400 响应。
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
        success: false,
      },
      400,
    )
  }
}

export { handleSyncUser }
