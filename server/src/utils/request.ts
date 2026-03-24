import type { AppContext, SyncOperations, SyncSetPayload, SyncToServerKey } from '../types'
import { SYNC_TO_SERVER_KEYS } from '../types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const syncToServerKeySet = new Set<string>(SYNC_TO_SERVER_KEYS)

// 只接受标准 Bearer token，并在进入业务逻辑前完成格式过滤。
function getBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null
  }

  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!TOKEN_PATTERN.test(token)) {
    return null
  }

  return token
}

function getUserStorage(c: AppContext, email: string) {
  const id = c.env.USER_STORAGE.idFromName(email)
  return c.env.USER_STORAGE.get(id)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSyncToServerKey(value: string): value is SyncToServerKey {
  return syncToServerKeySet.has(value)
}

// 路由参数和请求体里的邮箱都统一做 decode、trim 和小写化，避免同一邮箱产生多份存储。
function normalizeEmail(value: string) {
  try {
    const email = decodeURIComponent(value).trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      return null
    }

    return email
  } catch {
    return null
  }
}

// 同步请求支持 get / set / delete 三类操作，这里集中做结构校验和 key 白名单过滤。
function parseSyncOperations(value: unknown): SyncOperations | null {
  if (!isRecord(value)) {
    return null
  }

  const operations: SyncOperations = {}

  if (value.get !== undefined) {
    if (!Array.isArray(value.get) || !value.get.every(item => typeof item === 'string' && isSyncToServerKey(item))) {
      return null
    }

    operations.get = value.get
  }

  if (value.delete !== undefined) {
    if (
      !Array.isArray(value.delete) ||
      !value.delete.every(item => typeof item === 'string' && isSyncToServerKey(item))
    ) {
      return null
    }

    operations.delete = value.delete
  }

  if (value.set !== undefined) {
    if (!isRecord(value.set)) {
      return null
    }

    const nextSet: SyncSetPayload = {}
    for (const [key, itemValue] of Object.entries(value.set)) {
      if (!isSyncToServerKey(key)) {
        return null
      }

      nextSet[key] = itemValue
    }

    operations.set = nextSet
  }

  return operations
}

// 只接受对象类型 JSON，数组、字符串等 payload 会直接按非法请求处理。
async function readJsonBody(c: AppContext) {
  const payload = await c.req.json().catch(() => null)
  return isRecord(payload) ? payload : null
}

export { getBearerToken, getUserStorage, isRecord, normalizeEmail, parseSyncOperations, readJsonBody }
