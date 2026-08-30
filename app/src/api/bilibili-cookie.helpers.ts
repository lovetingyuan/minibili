const REQUIRED_LOGIN_COOKIE_NAMES = ["SESSDATA", "DedeUserID"] as const;

export const BILIBILI_API_COOKIE_URL = "https://api.bilibili.com/";

export function getBilibiliCsrf(cookieHeader: string) {
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator > 0 && part.slice(0, separator).trim() === "bili_jct") {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

export function isBilibiliUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") &&
      (hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"))
    );
  } catch {
    return false;
  }
}

export function hasBilibiliLoginCookie(cookieHeader: string) {
  const cookies = new Map<string, string>();

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    cookies.set(name, value);
  }

  return REQUIRED_LOGIN_COOKIE_NAMES.every((name) => Boolean(cookies.get(name)));
}

export function getBilibiliUserId(cookieHeader: string) {
  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 1 || part.slice(0, separatorIndex).trim() !== "DedeUserID") {
      continue;
    }

    const value = part.slice(separatorIndex + 1).trim();
    try {
      const decodedValue = decodeURIComponent(value);
      return /^\d+$/.test(decodedValue) ? decodedValue : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function createBilibiliRequestHeaders(
  url: string,
  headers: HeadersInit | undefined,
  cookie: string,
) {
  const requestHeaders = new Headers(headers);

  if (cookie && isBilibiliUrl(url)) {
    requestHeaders.set("cookie", cookie);
  }

  return requestHeaders;
}

export async function resolveBilibiliCookie(
  storedCookie: string | null,
  createAnonymousCookie: () => Promise<string>,
) {
  return storedCookie?.trim() || createAnonymousCookie();
}
