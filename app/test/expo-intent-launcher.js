/**
 * Vitest 用的 expo-intent-launcher 替身。
 */

export async function startActivityAsync() {
  return { resultCode: 0 };
}
