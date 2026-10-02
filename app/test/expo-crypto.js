import { createHash } from "node:crypto";

/**
 * Vitest 用的 expo-crypto 替身：真实实现依赖 expo-modules-core 原生化，
 * 纯逻辑单测只需要 SHA256 摘要。
 */

const ALGORITHM_BY_NAME = {
  "SHA-1": "sha1",
  "SHA-256": "sha256",
  "SHA-384": "sha384",
  "SHA-512": "sha512",
  "MD5": "md5",
};

export const CryptoDigestAlgorithm = {
  MD5: "MD5",
  SHA1: "SHA-1",
  SHA256: "SHA-256",
  SHA384: "SHA-384",
  SHA512: "SHA-512",
};

export const CryptoEncoding = {
  HEX: "hex",
  BASE64: "base64",
};

export async function digestStringAsync(algorithm, data, options) {
  const nodeAlgorithm = ALGORITHM_BY_NAME[algorithm] ?? "sha256";
  const hash = createHash(nodeAlgorithm).update(data, "utf8");
  if (options?.encoding === CryptoEncoding.BASE64) {
    return hash.digest("base64");
  }
  return hash.digest("hex");
}

export async function digestAsync(algorithm, data) {
  const nodeAlgorithm = ALGORITHM_BY_NAME[algorithm] ?? "sha256";
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return createHash(nodeAlgorithm).update(buffer).digest().buffer;
}

export async function getRandomValues(typedArray) {
  for (let index = 0; index < typedArray.length; index += 1) {
    typedArray[index] = Math.floor(Math.random() * 256);
  }
  return typedArray;
}

export function randomUUID() {
  return globalThis.crypto.randomUUID();
}
