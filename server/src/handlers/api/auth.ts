import { sendOtpEmail } from "../../services/email";
import { getUserStorage, normalizeEmail, readJsonBody } from "../../utils/request";
import type { AppContext } from "../../types";
import {
  createOtpCode,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_RETRY_LIMIT,
} from "../../user-record-store";

const OTP_PATTERN = /^[A-Z0-9]{6}$/;
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 发送验证码前会先检查冷却时间，避免同一邮箱被短时间内重复触发。
async function handleSendOtp(c: AppContext) {
  const body = await readJsonBody(c);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : null;
  if (!email) {
    return c.json({ error: "Invalid email", success: false }, 400);
  }

  const store = getUserStorage(c, email);
  const canSendOtpResult = await store.canSendOtp();
  if (!canSendOtpResult.canSend) {
    return c.json(
      {
        error: `请等待 ${canSendOtpResult.waitSeconds} 秒后再试`,
        success: false,
        waitSeconds: canSendOtpResult.waitSeconds,
      },
      429,
    );
  }

  const otp = createOtpCode();
  await store.saveOtp(otp);

  const emailResult = await sendOtpEmail(c.env.RESEND_API_KEY, c.env.RESEND_FROM_EMAIL, email, otp);

  if (!emailResult.success) {
    await store.clearOtpState();
    return c.json(
      {
        error: emailResult.error ?? "发送验证码失败，请稍后重试",
        success: false,
      },
      500,
    );
  }

  return c.json({
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    message: "验证码已发送",
    resendAfterSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000),
    retryLimit: OTP_RETRY_LIMIT,
    success: true,
  });
}

async function handleVerifyOtp(c: AppContext) {
  const body = await readJsonBody(c);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : null;
  const otp = typeof body?.otp === "string" ? body.otp.trim().toUpperCase() : null;
  if (!email || !otp || !OTP_PATTERN.test(otp)) {
    return c.json({ error: "Invalid verify payload", success: false }, 400);
  }

  const store = getUserStorage(c, email);
  const verifyResult = await store.verifyOtp(otp);
  if (!verifyResult.valid) {
    // 将存储层的失败原因映射成前端可直接展示的文案。
    const errorMessage =
      verifyResult.reason === "expired"
        ? "验证码已过期"
        : verifyResult.reason === "exhausted"
          ? "验证码尝试次数已达上限，请重新发送"
          : "验证码错误";

    return c.json(
      {
        error: errorMessage,
        success: false,
      },
      400,
    );
  }

  const issuedToken = await store.issueToken();
  return c.json({
    expiresAt: issuedToken.expiresAt,
    success: true,
    token: issuedToken.token,
  });
}

// 状态检查在 token 无效时会顺便清理认证状态，避免客户端反复携带脏 token。
async function handleAuthStatus(c: AppContext) {
  const body = await readJsonBody(c);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : null;
  const token =
    typeof body?.token === "string" && TOKEN_PATTERN.test(body.token) ? body.token : null;
  if (!email || !token) {
    return c.json({ error: "Invalid auth payload", success: false }, 400);
  }

  const store = getUserStorage(c, email);
  const verifyResult = await store.verifyToken(token);
  if (!verifyResult.valid) {
    await store.clearAuthState();
    return c.json({
      reason: verifyResult.reason ?? "invalid",
      success: true,
      valid: false,
    });
  }

  const issuedToken = await store.rotateToken();
  return c.json({
    expiresAt: issuedToken.expiresAt,
    success: true,
    token: issuedToken.token,
    valid: true,
  });
}

// 退出登录允许过期 token 触发清理，这样客户端本地和服务端状态都能回收。
async function handleLogout(c: AppContext) {
  const body = await readJsonBody(c);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : null;
  const token =
    typeof body?.token === "string" && TOKEN_PATTERN.test(body.token) ? body.token : null;
  if (!email || !token) {
    return c.json({ error: "Invalid auth payload", success: false }, 400);
  }

  const store = getUserStorage(c, email);
  const verifyResult = await store.verifyToken(token);
  if (verifyResult.valid || verifyResult.reason === "expired") {
    await store.clearAuthState();
  }

  return c.json({ success: true });
}

export { handleAuthStatus, handleLogout, handleSendOtp, handleVerifyOtp };
