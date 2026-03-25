import { serverUrl } from "@/constants";

import type { AuthFailureReason } from "../features/user-sync/types";
import { normalizeAuthEmail, normalizeOtpInput } from "../features/user-sync/helpers";

interface ErrorPayload {
  error?: string;
  reason?: AuthFailureReason;
  success?: boolean;
  waitSeconds?: number;
}

interface CheckAuthStatusValidPayload {
  expiresAt: number;
  success: true;
  token: string;
  valid: true;
}

interface CheckAuthStatusInvalidPayload {
  reason: AuthFailureReason;
  success: true;
  valid: false;
}

interface SendOtpSuccessPayload {
  expiresInSeconds: number;
  resendAfterSeconds: number;
  retryLimit: number;
  success: true;
}

interface VerifyOtpSuccessPayload {
  expiresAt: number;
  success: true;
  token: string;
}

export interface SendOtpResult {
  error?: string;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
  retryLimit?: number;
  success: boolean;
  waitSeconds?: number;
}

export interface VerifyOtpResult {
  error?: string;
  expiresAt?: number;
  success: boolean;
  token?: string;
}

export interface CheckAuthStatusResult {
  expiresAt?: number;
  reason?: AuthFailureReason;
  success: boolean;
  token?: string;
  valid: boolean;
}

async function parsePayload<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPayloadError(payload: unknown, fallback: string) {
  if (isRecord(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

function getPayloadWaitSeconds(payload: unknown) {
  if (isRecord(payload) && typeof payload.waitSeconds === "number") {
    return payload.waitSeconds;
  }

  return undefined;
}

function isCheckAuthStatusValidPayload(payload: unknown): payload is CheckAuthStatusValidPayload {
  return (
    isRecord(payload) &&
    payload.success === true &&
    payload.valid === true &&
    typeof payload.token === "string" &&
    typeof payload.expiresAt === "number"
  );
}

function isCheckAuthStatusInvalidPayload(
  payload: unknown,
): payload is CheckAuthStatusInvalidPayload {
  return (
    isRecord(payload) &&
    payload.success === true &&
    payload.valid === false &&
    (payload.reason === "expired" || payload.reason === "invalid" || payload.reason === "network")
  );
}

function isSendOtpSuccessPayload(payload: unknown): payload is SendOtpSuccessPayload {
  return (
    isRecord(payload) &&
    payload.success === true &&
    typeof payload.expiresInSeconds === "number" &&
    typeof payload.resendAfterSeconds === "number" &&
    typeof payload.retryLimit === "number"
  );
}

function isVerifyOtpSuccessPayload(payload: unknown): payload is VerifyOtpSuccessPayload {
  return (
    isRecord(payload) &&
    payload.success === true &&
    typeof payload.token === "string" &&
    typeof payload.expiresAt === "number"
  );
}

export async function checkAuthStatus(
  email: string,
  token: string,
): Promise<CheckAuthStatusResult> {
  try {
    const response = await fetch(`${serverUrl}/api/auth/status`, {
      body: JSON.stringify({
        email: normalizeAuthEmail(email),
        token,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = await parsePayload<
      CheckAuthStatusValidPayload | CheckAuthStatusInvalidPayload | ErrorPayload
    >(response);

    if (!response.ok || !payload) {
      return {
        reason: "network",
        success: false,
        valid: false,
      };
    }

    if (isCheckAuthStatusValidPayload(payload)) {
      return {
        expiresAt: payload.expiresAt,
        success: true,
        token: payload.token,
        valid: true,
      };
    }

    if (isCheckAuthStatusInvalidPayload(payload)) {
      return {
        reason: payload.reason,
        success: true,
        valid: false,
      };
    }

    return {
      reason: "network",
      success: false,
      valid: false,
    };
  } catch {
    return {
      reason: "network",
      success: false,
      valid: false,
    };
  }
}

export async function logout(email: string, token: string) {
  try {
    const response = await fetch(`${serverUrl}/api/auth/logout`, {
      body: JSON.stringify({
        email: normalizeAuthEmail(email),
        token,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await parsePayload<{ success?: boolean }>(response);
    return payload?.success === true;
  } catch {
    return false;
  }
}

export async function sendOtp(email: string): Promise<SendOtpResult> {
  try {
    const response = await fetch(`${serverUrl}/api/auth/otp`, {
      body: JSON.stringify({
        email: normalizeAuthEmail(email),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = await parsePayload<SendOtpSuccessPayload | ErrorPayload>(response);

    if (response.status === 429) {
      return {
        error: getPayloadError(payload, "请求过于频繁"),
        success: false,
        waitSeconds: getPayloadWaitSeconds(payload),
      };
    }

    if (!response.ok || !isSendOtpSuccessPayload(payload)) {
      return {
        error: getPayloadError(payload, "发送验证码失败"),
        success: false,
      };
    }

    return {
      expiresInSeconds: payload.expiresInSeconds,
      resendAfterSeconds: payload.resendAfterSeconds,
      retryLimit: payload.retryLimit,
      success: true,
    };
  } catch {
    return {
      error: "网络错误，请稍后重试",
      success: false,
    };
  }
}

export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
  try {
    const response = await fetch(`${serverUrl}/api/auth/verify`, {
      body: JSON.stringify({
        email: normalizeAuthEmail(email),
        otp: normalizeOtpInput(otp),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = await parsePayload<VerifyOtpSuccessPayload | ErrorPayload>(response);

    if (!response.ok || !isVerifyOtpSuccessPayload(payload)) {
      return {
        error: getPayloadError(payload, "验证码错误"),
        success: false,
      };
    }

    return {
      expiresAt: payload.expiresAt,
      success: true,
      token: payload.token,
    };
  } catch {
    return {
      error: "网络错误，请稍后重试",
      success: false,
    };
  }
}
