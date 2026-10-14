import { createHash, randomBytes } from "node:crypto";

export const MIN_PASSWORD_LENGTH = 8;

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 60;

export type ResetToken = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * Only the SHA-256 of the token is persisted, so a database leak cannot be
 * replayed to take over an account.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken(): ResetToken {
  const token = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
  };
}

export function isExpired(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() <= Date.now();
}

function resolveBaseUrl(request?: Request): string {
  const configured = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "";
}

export function buildResetUrl(token: string, request?: Request): string {
  return `${resolveBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;
}

export type MailResult = "sent" | "not-configured" | "failed";

/**
 * Optional transport. Without RESEND_API_KEY + RESET_EMAIL_FROM the app is
 * admin-mediated: an administrator generates a one-time link and shares it.
 */
export async function sendResetEmail(to: string, resetUrl: string): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_EMAIL_FROM;
  if (!apiKey || !from) return "not-configured";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Reset your Storgbay password",
        text: `Use this link to choose a new password (valid for 60 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Use this link to choose a new password (valid for 60 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
