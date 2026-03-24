export function normalizeAuthEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeOtpInput(value: string) {
  return value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 6)
}

function assignSnapshotValue<
  Snapshot extends Record<string, unknown>,
  Key extends keyof Snapshot,
>(target: Partial<Snapshot>, key: Key, value: Snapshot[Key]) {
  target[key] = value
}

export interface InitialSyncResolution<Snapshot extends Record<string, unknown>> {
  hasRemoteData: boolean
  nextLocal: Snapshot
  nextRemoteSet: Partial<Snapshot> | null
}

export function resolveInitialSync<Key extends string, Snapshot extends Record<Key, unknown>>(
  keys: readonly Key[],
  localSnapshot: Snapshot,
  remoteSnapshot: Partial<Snapshot>,
  defaultSnapshot: Snapshot,
): InitialSyncResolution<Snapshot> {
  const hasRemoteData = keys.some(key => Object.prototype.hasOwnProperty.call(remoteSnapshot, key))
  if (!hasRemoteData) {
    return {
      hasRemoteData: false,
      nextLocal: localSnapshot,
      nextRemoteSet: { ...localSnapshot },
    }
  }

  const nextLocal = {} as Snapshot
  const nextRemoteSet: Partial<Snapshot> = {}

  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(remoteSnapshot, key)) {
      assignSnapshotValue(nextLocal, key, remoteSnapshot[key] as Snapshot[Key])
      return
    }

    assignSnapshotValue(nextLocal, key, defaultSnapshot[key])
    assignSnapshotValue(nextRemoteSet, key, defaultSnapshot[key])
  })

  return {
    hasRemoteData: true,
    nextLocal,
    nextRemoteSet: Object.keys(nextRemoteSet).length > 0 ? nextRemoteSet : null,
  }
}
