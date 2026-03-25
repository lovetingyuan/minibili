import { serverUrl } from "@/constants";
import type { SyncToServerKey } from "@/store";

import { normalizeAuthEmail } from "../features/user-sync/helpers";

export interface SyncRequestPayload {
  delete?: SyncToServerKey[];
  get?: SyncToServerKey[];
  set?: Partial<Record<SyncToServerKey, unknown>>;
}

export interface SyncSuccessResult<Result> {
  result: Result;
  success: true;
}

export interface SyncErrorResult {
  code: "bad_request" | "network" | "unauthorized";
  error: string;
  success: false;
}

export type SyncRequestResult<Result> = SyncErrorResult | SyncSuccessResult<Result>;

export async function syncUserData<Result>(
  email: string,
  token: string,
  payload: SyncRequestPayload,
): Promise<SyncRequestResult<Result>> {
  try {
    const response = await fetch(
      `${serverUrl}/api/users/${encodeURIComponent(normalizeAuthEmail(email))}/sync`,
      {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      result?: Result;
      success?: boolean;
    } | null;

    if (response.status === 401) {
      return {
        code: "unauthorized",
        error: data?.error ?? "未授权",
        success: false,
      };
    }

    if (!response.ok || !data || data.success !== true) {
      return {
        code: "bad_request",
        error: data?.error ?? "同步失败",
        success: false,
      };
    }

    return {
      result: data.result as Result,
      success: true,
    };
  } catch {
    return {
      code: "network",
      error: "网络错误，稍后重试",
      success: false,
    };
  }
}
