import { createHash, randomBytes } from "node:crypto";
import { appUrl } from "@/lib/app-url";

export const MIN_PASSWORD_LENGTH = 8;

const RESET_TOKEN_BYTES = 32;
export const RESET_TOKEN_TTL_MINUTES = 60;

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

export function buildResetUrl(token: string, request?: Request): string {
  return `${appUrl("/reset-password", request)}?token=${encodeURIComponent(token)}`;
}
