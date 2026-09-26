const MANAGEMENT_USERNAME = "admin";

type ManagementAuthResult = "authorized" | "unauthorized" | "unconfigured";

function decodeBasicCredentials(header: string | undefined) {
  if (!header) {
    return null;
  }
  const match = /^Basic\s+(.+)$/i.exec(header);
  if (!match) {
    return null;
  }
  try {
    const bytes = Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const separator = decoded.indexOf(":");
    if (separator < 0) {
      return null;
    }
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

async function compareSecret(provided: string, expected: string) {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

export async function verifyManagementAuth(
  authorization: string | undefined,
  expectedPassword: string | undefined,
): Promise<ManagementAuthResult> {
  if (!expectedPassword) {
    return "unconfigured";
  }
  const credentials = decodeBasicCredentials(authorization);
  if (!credentials || credentials.username !== MANAGEMENT_USERNAME) {
    return "unauthorized";
  }
  return (await compareSecret(credentials.password, expectedPassword))
    ? "authorized"
    : "unauthorized";
}
