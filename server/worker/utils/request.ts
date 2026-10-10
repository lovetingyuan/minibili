export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class RequestPayloadTooLargeError extends Error {}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) {
    return null;
  }
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestPayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      throw error;
    }
    return null;
  } finally {
    reader.releaseLock();
  }
}
