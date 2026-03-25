import * as SecureStore from "expo-secure-store";

const AUTH_KEYS = {
  email: "auth_email",
  token: "auth_token",
} as const;

export async function clearAuthData() {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_KEYS.email),
    SecureStore.deleteItemAsync(AUTH_KEYS.token),
  ]);
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync(AUTH_KEYS.token);
}

export async function getAuthData() {
  const [email, token] = await Promise.all([
    SecureStore.getItemAsync(AUTH_KEYS.email),
    SecureStore.getItemAsync(AUTH_KEYS.token),
  ]);

  return { email, token };
}

export async function setAuthData(email: string, token: string) {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_KEYS.email, email),
    SecureStore.setItemAsync(AUTH_KEYS.token, token),
  ]);
}
