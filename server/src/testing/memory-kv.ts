export class MemoryKvStorage implements Pick<DurableObjectStorage, "kv" | "transactionSync"> {
  private data = new Map<string, unknown>();
  failOnKey: string | null = null;
  readonly kv: SyncKvStorage = {
    get: <T>(key: string) => this.data.get(key) as T | undefined,
    put: <T>(key: string, value: T) => {
      if (key === this.failOnKey) throw new Error("storage unavailable");
      this.data.set(key, structuredClone(value));
    },
    delete: (key) => this.data.delete(key),
    list: <T>() => [...this.data.entries()] as [string, T][],
  };
  transactionSync<T>(work: () => T): T {
    const before = structuredClone(this.data);
    try {
      return work();
    } catch (error) {
      this.data = before;
      throw error;
    }
  }
}
