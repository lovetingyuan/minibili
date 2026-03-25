const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailResult {
  error?: string;
  success: boolean;
}

export async function sendOtpEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  otp: string,
): Promise<SendEmailResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="margin-bottom: 12px;">MiniBili 登录验证码</h2>
            <p style="margin-bottom: 12px;">请输入以下验证码完成登录：</p>
            <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">
              ${otp}
            </p>
            <p style="color: #666; margin-top: 12px;">验证码 5 分钟内有效，最多可尝试 5 次。</p>
            <p style="color: #999; margin-top: 24px;">如果不是你本人操作，请忽略这封邮件。</p>
          </div>
        `,
        subject: "MiniBili 登录验证码",
        to: toEmail,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        error: payload?.message ?? "Failed to send email",
        success: false,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown email error",
      success: false,
    };
  }
}
