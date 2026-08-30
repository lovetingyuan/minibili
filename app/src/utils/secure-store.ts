const BILIBILI_COOKIE_KEY = "bilibili_cookie";

let secureStorePromise: Promise<typeof import("expo-secure-store")> | null = null;

function getSecureStore() {
  secureStorePromise ??= import("expo-secure-store");
  return secureStorePromise;
}

export async function getStoredBilibiliCookie() {
  const SecureStore = await getSecureStore();
  return SecureStore.getItemAsync(BILIBILI_COOKIE_KEY);
}

export async function setStoredBilibiliCookie(cookie: string) {
  const SecureStore = await getSecureStore();
  return SecureStore.setItemAsync(BILIBILI_COOKIE_KEY, cookie);
}

export async function clearStoredBilibiliCookie() {
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(BILIBILI_COOKIE_KEY);
}
