/**
 * Vitest 用的 expo-secure-store 替身：真实实现会在加载时初始化 expo-modules-core，
 * 纯逻辑单测不需要原生能力。
 */

const store = new Map();

export async function getItemAsync(key) {
  return store.get(key) ?? null;
}

export async function setItemAsync(key, value) {
  store.set(key, value);
}

export async function deleteItemAsync(key) {
  store.delete(key);
}
